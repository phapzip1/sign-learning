CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId` varchar(150) NOT NULL,
    `ProductVersion` varchar(32) NOT NULL,
    PRIMARY KEY (`MigrationId`)
);

START TRANSACTION;
CREATE TABLE `Decks` (
    `Id` varchar(255) NOT NULL,
    `Name` longtext NOT NULL,
    `UserId` longtext NOT NULL,
    `Description` longtext NOT NULL,
    `LearningSteps` json NOT NULL,
    `RelearningSteps` json NOT NULL,
    `MaximumInterval` int unsigned NOT NULL,
    `NewCardsPerDay` int unsigned NOT NULL,
    `MaximumReviewsPerDay` int unsigned NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `Words` (
    `Id` int unsigned NOT NULL AUTO_INCREMENT,
    `Value` longtext NOT NULL,
    `Cover` longtext NOT NULL,
    `Meaning` longtext NOT NULL,
    `Level` int NOT NULL,
    `DemoURL` longtext NOT NULL,
    `Instruction` longtext NOT NULL,
    `Topic` int NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `WordSuggestions` (
    `Id` varchar(255) NOT NULL,
    `UserId` longtext NOT NULL,
    `Value` longtext NOT NULL,
    `Meaning` longtext NOT NULL,
    `Level` int NOT NULL,
    `Topic` int NOT NULL,
    `Cover` longtext NULL,
    `DemoURL` longtext NULL,
    `Instruction` longtext NULL,
    `Note` longtext NULL,
    `Status` int NOT NULL,
    `ApprovedWordId` int unsigned NULL,
    `ReviewedByUserId` longtext NULL,
    `ReviewNote` longtext NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    `ReviewedAt` datetime(6) NULL,
    PRIMARY KEY (`Id`)
);

CREATE TABLE `Cards` (
    `Id` varchar(255) NOT NULL,
    `WordId` int unsigned NOT NULL,
    `DeckId` varchar(255) NOT NULL,
    `State` int NOT NULL,
    `Step` int NULL,
    `Stability` float NOT NULL,
    `Difficulty` float NOT NULL,
    `FirstReviewAt` datetime(6) NULL,
    `LastReviewAt` datetime(6) NULL,
    `DueAt` datetime(6) NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Cards_Decks_DeckId` FOREIGN KEY (`DeckId`) REFERENCES `Decks` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Cards_Words_WordId` FOREIGN KEY (`WordId`) REFERENCES `Words` (`Id`) ON DELETE CASCADE
);

CREATE TABLE `ReviewLogs` (
    `Id` varchar(255) NOT NULL,
    `CardId` varchar(255) NOT NULL,
    `ReviewDate` datetime(6) NOT NULL,
    `Rating` int NOT NULL,
    `ReviewDuration` int NULL,
    `ClientEventId` longtext NOT NULL,
    PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ReviewLogs_Cards_CardId` FOREIGN KEY (`CardId`) REFERENCES `Cards` (`Id`) ON DELETE CASCADE
);

CREATE INDEX `IX_Cards_DeckId` ON `Cards` (`DeckId`);

CREATE INDEX `IX_Cards_WordId` ON `Cards` (`WordId`);

CREATE INDEX `IX_ReviewLogs_CardId` ON `ReviewLogs` (`CardId`);

INSERT INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20261001100249_InitialCreate', '10.0.9');

COMMIT;

