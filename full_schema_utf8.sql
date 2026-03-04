-- CreateTable
CREATE TABLE `owners` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `notification_email` VARCHAR(191) NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'owner',
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `verification_token` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `owners_email_key`(`email`),
    UNIQUE INDEX `owners_verification_token_key`(`verification_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` VARCHAR(191) NOT NULL,
    `owner_id` VARCHAR(191) NOT NULL,
    `make` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `plate` VARCHAR(191) NOT NULL,
    `vin` VARCHAR(191) NULL,
    `engine_type` VARCHAR(191) NULL,
    `current_odo` INTEGER NOT NULL DEFAULT 0,
    `revenue_license_date` DATE NULL,
    `insurance_date` DATE NULL,
    `emission_report_date` DATE NULL,
    `photo` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `vehicles_plate_key`(`plate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `garages` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `owner_email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'garage',
    `address` VARCHAR(191) NULL,
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `verification_token` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `garages_owner_email_key`(`owner_email`),
    UNIQUE INDEX `garages_verification_token_key`(`verification_token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `garage_customers` (
    `id` VARCHAR(191) NOT NULL,
    `garage_id` VARCHAR(191) NOT NULL,
    `plate` VARCHAR(191) NOT NULL,
    `make` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `phone` VARCHAR(191) NULL,
    `owner_name` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `odometer` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `garage_customers_garage_id_plate_key`(`garage_id`, `plate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bills` (
    `id` VARCHAR(191) NOT NULL,
    `garage_id` VARCHAR(191) NULL,
    `garage_customer_id` VARCHAR(191) NULL,
    `vehicle_id` VARCHAR(191) NULL,
    `plate` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL,
    `discount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `odometer` INTEGER NULL,
    `notes` TEXT NULL,
    `photos` JSON NULL,
    `status` VARCHAR(191) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_items` (
    `id` VARCHAR(191) NOT NULL,
    `bill_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(65, 30) NOT NULL,
    `lifespan_odo` INTEGER NULL,
    `lifespan_months` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle_parts` (
    `id` VARCHAR(191) NOT NULL,
    `vehicle_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `last_service_odo` INTEGER NOT NULL DEFAULT 0,
    `lifespan_odo` INTEGER NOT NULL,
    `last_service_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lifespan_months` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `web_push_subscriptions` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `endpoint` VARCHAR(191) NOT NULL,
    `p256dh` LONGTEXT NOT NULL,
    `auth` LONGTEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `web_push_subscriptions_endpoint_key`(`endpoint`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `owners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `garage_customers` ADD CONSTRAINT `garage_customers_garage_id_fkey` FOREIGN KEY (`garage_id`) REFERENCES `garages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_garage_id_fkey` FOREIGN KEY (`garage_id`) REFERENCES `garages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_garage_customer_id_fkey` FOREIGN KEY (`garage_customer_id`) REFERENCES `garage_customers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bills` ADD CONSTRAINT `bills_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_items` ADD CONSTRAINT `service_items_bill_id_fkey` FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle_parts` ADD CONSTRAINT `vehicle_parts_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `owners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `web_push_subscriptions` ADD CONSTRAINT `web_push_subscriptions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `owners`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

