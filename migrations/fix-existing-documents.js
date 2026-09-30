/**
 * Migration script to fix users who already have documents but wrong verification status
 * This updates users who have driverLicense or passport but are marked as 'unverified'
 */

const mongoose = require('mongoose');
const config = require('../src/config/config');

async function migrate() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongoose.url, config.mongoose.options);
        console.log('Connected to MongoDB');

        const User = mongoose.connection.collection('users');

        // Find users who have documents but are marked as unverified
        const usersWithDocs = await User.find({
            verificationStatus: 'unverified',
            $or: [
                { driverLicense: { $exists: true, $ne: null, $ne: '' } },
                { passport: { $exists: true, $ne: null, $ne: '' } },
            ],
        }).toArray();

        console.log(`\n📊 Found ${usersWithDocs.length} users with documents but marked as 'unverified'`);

        if (usersWithDocs.length > 0) {
            // Update these users to 'on_review'
            const result = await User.updateMany(
                {
                    verificationStatus: 'unverified',
                    $or: [
                        { driverLicense: { $exists: true, $ne: null, $ne: '' } },
                        { passport: { $exists: true, $ne: null, $ne: '' } },
                    ],
                },
                {
                    $set: {
                        verificationStatus: 'on_review',
                        isEmailVerified: false,
                    },
                },
            );

            console.log(`✓ Updated ${result.modifiedCount} users to 'on_review' status`);

            // Show sample of updated users
            console.log('\n📋 Sample of updated users:');
            usersWithDocs.slice(0, 5).forEach((user) => {
                console.log(
                    `   - ${user.email}: ${user.driverLicense ? 'driverLicense ✓' : ''} ${
                        user.passport ? 'passport ✓' : ''
                    }`,
                );
            });
        }

        // Also check for users who should be unverified (no documents but marked as on_review)
        const usersWithoutDocs = await User.find({
            verificationStatus: 'on_review',
            $and: [
                { $or: [{ driverLicense: { $exists: false } }, { driverLicense: null }, { driverLicense: '' }] },
                { $or: [{ passport: { $exists: false } }, { passport: null }, { passport: '' }] },
            ],
        }).toArray();

        if (usersWithoutDocs.length > 0) {
            console.log(`\n📊 Found ${usersWithoutDocs.length} users marked as 'on_review' but no documents`);

            const result2 = await User.updateMany(
                {
                    verificationStatus: 'on_review',
                    $and: [
                        {
                            $or: [
                                { driverLicense: { $exists: false } },
                                { driverLicense: null },
                                { driverLicense: '' },
                            ],
                        },
                        { $or: [{ passport: { $exists: false } }, { passport: null }, { passport: '' }] },
                    ],
                },
                {
                    $set: {
                        verificationStatus: 'unverified',
                        isEmailVerified: false,
                    },
                },
            );

            console.log(`✓ Updated ${result2.modifiedCount} users to 'unverified' status`);
        }

        // Final verification status summary
        const statusCounts = await User.aggregate([
            {
                $group: {
                    _id: '$verificationStatus',
                    count: { $sum: 1 },
                },
            },
        ]).toArray();

        console.log('\n📈 Final verification status distribution:');
        statusCounts.forEach((item) => {
            console.log(`   ${item._id}: ${item.count} users`);
        });

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
