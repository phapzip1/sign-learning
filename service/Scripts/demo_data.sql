-- Demo data for recording the Sign Learning presentation.
-- Run AFTER create_schema.sql and insert_first_40_words.sql. Requires MySQL 8+.
--
-- It creates, for ONE user:
--   * "Demo deck"       4 new cards (bird, car, carrot, cereal) to study live on camera.
--   * "Everyday words"  10 learned cards (2 of them due now) with ~3 months of review history,
--                       ending yesterday with a 12-day streak, so studying live makes it 13.
--   * 4 word suggestions: 2 pending (for the admin tab), 1 approved, 1 rejected.
-- apple and cat are left out on purpose: use them for the live sign search + "Add to collection".
--
-- Safe to re-run: it first deletes the demo rows it created before (ids starting with "demo-"),
-- and never touches your own decks. Words already in one of your own decks are skipped,
-- because each user may hold only one card per word.

-- Your Clerk user id (Clerk dashboard → Users → your user → "User ID", starts with "user_").
SET @uid := 'user_3JOXJefhAv83iLd5XdAWtJy7lMJ';

SET @now := UTC_TIMESTAMP();
SET @today := UTC_DATE();

START TRANSACTION;

-- 0. Remove earlier demo data. Cards and review logs are deleted by cascade.
DELETE FROM `Decks` WHERE `Id` IN ('demo-deck-study', 'demo-deck-practice');
DELETE FROM `WordSuggestions` WHERE `Id` LIKE 'demo-sugg-%';

-- 1. Decks (default study settings: steps 1 min / 10 min, relearn 10 min).
INSERT INTO `Decks` (`Id`, `Name`, `UserId`, `Description`, `LearningSteps`, `RelearningSteps`,
                     `MaximumInterval`, `NewCardsPerDay`, `MaximumReviewsPerDay`, `CreatedAt`, `UpdatedAt`)
VALUES
  ('demo-deck-study', 'Demo deck', @uid, 'New signs to learn this week',
   '[60, 600]', '[600]', 36500, 20, 200, @now - INTERVAL 2 DAY, @now - INTERVAL 2 DAY),
  ('demo-deck-practice', 'Everyday words', @uid, 'Signs I have been practising',
   '[60, 600]', '[600]', 36500, 20, 200, @now - INTERVAL 95 DAY, @now - INTERVAL 1 DAY);

-- 2. New cards for the live study session (State 0 = New).
INSERT INTO `Cards` (`Id`, `WordId`, `DeckId`, `State`, `Step`, `Stability`, `Difficulty`,
                     `FirstReviewAt`, `LastReviewAt`, `DueAt`, `CreatedAt`, `UpdatedAt`)
SELECT CONCAT('demo-card-', w.`Value`), w.`Id`, 'demo-deck-study', 0, NULL, 0, 0,
       NULL, NULL, NULL, @now - INTERVAL 2 DAY, @now - INTERVAL 2 DAY
FROM `Words` w
WHERE w.`Value` IN ('bird', 'car', 'carrot', 'cereal')
  AND NOT EXISTS (SELECT 1 FROM `Cards` c JOIN `Decks` d ON d.`Id` = c.`DeckId`
                  WHERE d.`UserId` = @uid AND c.`WordId` = w.`Id`);

-- 3. Learned cards (State 2 = Review). TV and boat are due now; the rest are due in the coming days.
INSERT INTO `Cards` (`Id`, `WordId`, `DeckId`, `State`, `Step`, `Stability`, `Difficulty`,
                     `FirstReviewAt`, `LastReviewAt`, `DueAt`, `CreatedAt`, `UpdatedAt`)
SELECT CONCAT('demo-card-', w.`Value`), w.`Id`, 'demo-deck-practice', 2, NULL,
       5 + CRC32(w.`Value`) % 20,
       4 + CRC32(w.`Value`) % 3,
       TIMESTAMP(@today - INTERVAL 90 DAY, '08:00:00'),
       TIMESTAMP(@today - INTERVAL 1 DAY, '08:30:00'),
       CASE WHEN w.`Value` IN ('TV', 'boat') THEN @now - INTERVAL 1 HOUR
            ELSE @now + INTERVAL (2 + CRC32(w.`Value`) % 10) DAY END,
       @now - INTERVAL 95 DAY, @now - INTERVAL 1 DAY
FROM `Words` w
WHERE w.`Value` IN ('TV', 'airplane', 'alligator', 'animal', 'aunt', 'bed', 'bee', 'boat', 'book', 'boy')
  AND NOT EXISTS (SELECT 1 FROM `Cards` c JOIN `Decks` d ON d.`Id` = c.`DeckId`
                  WHERE d.`UserId` = @uid AND c.`WordId` = w.`Id`);

-- 4. Review history over the last 90 days (UTC), deterministic so re-runs look the same:
--    every day from yesterday back 12 days (the streak), day 13 empty (ends the streak),
--    and about one day in three before that (fills the calendar and charts).
--    About 6 of the 10 cards per active day; ratings ~10% Again, 20% Hard, 60% Good, 10% Easy.
INSERT INTO `ReviewLogs` (`Id`, `CardId`, `ReviewDate`, `Rating`, `ReviewDuration`, `ClientEventId`)
WITH RECURSIVE days (d) AS (
  SELECT 1
  UNION ALL
  SELECT d + 1 FROM days WHERE d < 90
)
SELECT UUID(), c.`Id`,
       TIMESTAMP(@today - INTERVAL days.d DAY, '08:00:00') + INTERVAL (CRC32(CONCAT(days.d, c.`Id`)) % 50) MINUTE,
       CASE
         WHEN CRC32(CONCAT('r', days.d, c.`Id`)) % 10 < 1 THEN 0
         WHEN CRC32(CONCAT('r', days.d, c.`Id`)) % 10 < 3 THEN 1
         WHEN CRC32(CONCAT('r', days.d, c.`Id`)) % 10 < 9 THEN 2
         ELSE 3
       END,
       NULL, UUID()
FROM days
JOIN `Cards` c ON c.`DeckId` = 'demo-deck-practice'
WHERE (days.d <= 12 OR (days.d > 13 AND CRC32(CONCAT('day', days.d)) % 3 = 0))
  AND (CRC32(CONCAT(days.d, c.`Id`)) % 10 < 6
       -- one card every active day, so no streak day is ever empty
       OR c.`Id` = (SELECT MIN(c2.`Id`) FROM `Cards` c2 WHERE c2.`DeckId` = 'demo-deck-practice'));

-- 5. Word suggestions (Status: 0 Pending, 1 Approved, 2 Rejected; Level 1-3; Topic as in Word.cs).
INSERT INTO `WordSuggestions` (`Id`, `UserId`, `Value`, `Meaning`, `Level`, `Topic`, `Cover`, `DemoURL`,
                               `Instruction`, `Note`, `Status`, `ApprovedWordId`, `ReviewedByUserId`,
                               `ReviewNote`, `CreatedAt`, `UpdatedAt`, `ReviewedAt`)
VALUES
  ('demo-sugg-1', @uid, 'dog', 'A common pet animal that barks.', 1, 2, NULL, NULL, NULL,
   'A very common word for beginners.', 0, NULL, NULL, NULL,
   @now - INTERVAL 1 DAY, @now - INTERVAL 1 DAY, NULL),
  ('demo-sugg-2', @uid, 'grandma', 'The mother of your mother or father.', 1, 0, NULL, NULL, NULL,
   'Goes well with aunt and brother.', 0, NULL, NULL, NULL,
   @now - INTERVAL 3 HOUR, @now - INTERVAL 3 HOUR, NULL),
  ('demo-sugg-3', @uid, 'cereal', 'A breakfast food made from grain, often eaten with milk.', 1, 3, NULL, NULL, NULL,
   NULL, 1, (SELECT w.`Id` FROM `Words` w WHERE w.`Value` = 'cereal' LIMIT 1), @uid, 'Added to the dictionary.',
   @now - INTERVAL 12 DAY, @now - INTERVAL 10 DAY, @now - INTERVAL 10 DAY),
  ('demo-sugg-4', @uid, 'bigger', 'Larger in size than something else.', 2, 7, NULL, NULL, NULL,
   NULL, 2, NULL, @uid, 'Please include a demonstration video so the sign can be checked.',
   @now - INTERVAL 8 DAY, @now - INTERVAL 6 DAY, @now - INTERVAL 6 DAY);

COMMIT;

-- Optional checks:
-- SELECT d.`Name`, COUNT(c.`Id`) AS cards FROM `Decks` d LEFT JOIN `Cards` c ON c.`DeckId` = d.`Id`
--   WHERE d.`Id` LIKE 'demo-deck-%' GROUP BY d.`Name`;
-- SELECT DATE(r.`ReviewDate`) AS day, COUNT(*) AS reviews FROM `ReviewLogs` r
--   WHERE r.`CardId` LIKE 'demo-card-%' GROUP BY day ORDER BY day DESC LIMIT 15;
