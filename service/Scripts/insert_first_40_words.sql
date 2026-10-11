-- Seed the Words table with the first 40 signs the inference model can recognize
-- (prediction indices 0-39 in inference/assets/sign_to_prediction_index_map.json).
--
-- Value is the model's label verbatim, so a sign-search result matches its dictionary
-- entry. Topic and Level are stored as ints (Service.Models.Topic / Level):
--   Topic: 0 FamilyAndPeople, 1 PlacesAndTransportation, 2 AnimalsAndInsects,
--          3 FoodAndDrinks, 4 HomeAndFurniture, 5 FeelingsAndEmotions,
--          6 ActionsAndVerbs, 7 Other
--   Level: 1 Beginner, 2 Intermediate, 3 Advance
--
-- Cover, DemoURL and Instruction are required columns but left empty: add real media
-- URLs and reviewed signing instructions (e.g. via the admin Words tab) before release.
--
-- Safe to re-run: words whose Value already exists are skipped.

START TRANSACTION;

INSERT INTO `Words` (`Value`, `Meaning`, `Level`, `Topic`, `Cover`, `DemoURL`, `Instruction`, `CreatedAt`, `UpdatedAt`)
SELECT seed.`Value`, seed.`Meaning`, seed.`Level`, seed.`Topic`, '', '', '', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6)
FROM (
    SELECT 'TV' AS `Value`, 'A television; a screen at home for watching shows.' AS `Meaning`, 1 AS `Level`, 4 AS `Topic`  -- #0 HomeAndFurniture
    UNION ALL SELECT 'after', 'Later than something else; following in time.', 2, 7  -- #1 Other
    UNION ALL SELECT 'airplane', 'A vehicle with wings that flies through the air.', 1, 1  -- #2 PlacesAndTransportation
    UNION ALL SELECT 'all', 'Every one of a group; the whole amount.', 1, 7  -- #3 Other
    UNION ALL SELECT 'alligator', 'A large reptile with a long body, short legs and strong jaws.', 1, 2  -- #4 AnimalsAndInsects
    UNION ALL SELECT 'animal', 'A living creature such as a dog, bird or fish.', 1, 2  -- #5 AnimalsAndInsects
    UNION ALL SELECT 'another', 'One more; a different one.', 2, 7  -- #6 Other
    UNION ALL SELECT 'any', 'One or some, no matter which.', 2, 7  -- #7 Other
    UNION ALL SELECT 'apple', 'A round fruit with red, green or yellow skin.', 1, 3  -- #8 FoodAndDrinks
    UNION ALL SELECT 'arm', 'The part of the body between the shoulder and the hand.', 1, 7  -- #9 Other
    UNION ALL SELECT 'aunt', 'The sister of your mother or father, or your uncle''s wife.', 1, 0  -- #10 FamilyAndPeople
    UNION ALL SELECT 'awake', 'Not sleeping.', 1, 7  -- #11 Other
    UNION ALL SELECT 'backyard', 'The yard or garden behind a house.', 1, 4  -- #12 HomeAndFurniture
    UNION ALL SELECT 'bad', 'Not good; unpleasant or wrong.', 1, 5  -- #13 FeelingsAndEmotions
    UNION ALL SELECT 'balloon', 'A thin rubber bag that is filled with air or gas.', 1, 7  -- #14 Other
    UNION ALL SELECT 'bath', 'Washing your body in a tub of water.', 1, 4  -- #15 HomeAndFurniture
    UNION ALL SELECT 'because', 'For the reason that; used to explain why.', 2, 7  -- #16 Other
    UNION ALL SELECT 'bed', 'A piece of furniture to sleep on.', 1, 4  -- #17 HomeAndFurniture
    UNION ALL SELECT 'bedroom', 'A room for sleeping in.', 1, 4  -- #18 HomeAndFurniture
    UNION ALL SELECT 'bee', 'A flying insect that makes honey and can sting.', 1, 2  -- #19 AnimalsAndInsects
    UNION ALL SELECT 'before', 'Earlier than something else.', 2, 7  -- #20 Other
    UNION ALL SELECT 'beside', 'Next to; at the side of.', 2, 7  -- #21 Other
    UNION ALL SELECT 'better', 'More good; improved.', 2, 7  -- #22 Other
    UNION ALL SELECT 'bird', 'An animal with feathers and wings; most birds can fly.', 1, 2  -- #23 AnimalsAndInsects
    UNION ALL SELECT 'black', 'The darkest color, like the night sky.', 1, 7  -- #24 Other
    UNION ALL SELECT 'blow', 'To push air out of your mouth.', 1, 6  -- #25 ActionsAndVerbs
    UNION ALL SELECT 'blue', 'The color of a clear sky.', 1, 7  -- #26 Other
    UNION ALL SELECT 'boat', 'A vehicle that travels on water.', 1, 1  -- #27 PlacesAndTransportation
    UNION ALL SELECT 'book', 'Pages with words or pictures bound together to read.', 1, 7  -- #28 Other
    UNION ALL SELECT 'boy', 'A male child.', 1, 0  -- #29 FamilyAndPeople
    UNION ALL SELECT 'brother', 'A boy or man who has the same parents as you.', 1, 0  -- #30 FamilyAndPeople
    UNION ALL SELECT 'brown', 'The color of chocolate or soil.', 1, 7  -- #31 Other
    UNION ALL SELECT 'bug', 'A small insect or crawling creature.', 1, 2  -- #32 AnimalsAndInsects
    UNION ALL SELECT 'bye', 'A word said when leaving; goodbye.', 1, 7  -- #33 Other
    UNION ALL SELECT 'callonphone', 'To call someone on the telephone.', 2, 6  -- #34 ActionsAndVerbs
    UNION ALL SELECT 'can', 'To be able to do something.', 2, 6  -- #35 ActionsAndVerbs
    UNION ALL SELECT 'car', 'A vehicle with four wheels for driving on roads.', 1, 1  -- #36 PlacesAndTransportation
    UNION ALL SELECT 'carrot', 'A long orange vegetable that grows underground.', 1, 3  -- #37 FoodAndDrinks
    UNION ALL SELECT 'cat', 'A small furry animal often kept as a pet.', 1, 2  -- #38 AnimalsAndInsects
    UNION ALL SELECT 'cereal', 'A breakfast food made from grain, often eaten with milk.', 1, 3  -- #39 FoodAndDrinks
) AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM `Words` AS w WHERE w.`Value` = seed.`Value`
);

COMMIT;
