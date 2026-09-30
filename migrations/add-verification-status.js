/**
 * Migration script to add verificationStatus field and fix isEmailVerified
 * This script:
 * 1. Adds verificationStatus field based on current isEmailVerified value
 * 2. Converts isEmailVerified to boolean (true only when verified)
 */

const mongoose = require('mongoose');
const config = require('../src/config/config');

async function migrate() {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongoose.url, config.mongoose.options);
        console.log('Connected to MongoDB');

        const User = mongoose.connection.collection('users');

        // Count total users
        const totalUsers = await User.countDocuments();
        console.log(`\n📊 Total users to migrate: ${totalUsers}`);

        // Case 1: Users with isEmailVerified as boolean true or string 'verified'
        const verifiedUpdate = await User.updateMany(
            {
                $or: [{ isEmailVerified: true }, { isEmailVerified: 'verified' }],
            },
            {
                $set: {
                    isEmailVerified: true,
                    verificationStatus: 'verified',
                },
            },
        );
        console.log(
            `✓ Updated ${verifiedUpdate.modifiedCount} verified users → isEmailVerified: true, verificationStatus: 'verified'`,
        );

        // Case 2: Users with isEmailVerified as 'on_review'
        const onReviewUpdate = await User.updateMany(
            { isEmailVerified: 'on_review' },
            {
                $set: {
                    isEmailVerified: false,
                    verificationStatus: 'on_review',
                },
            },
        );
        console.log(
            `✓ Updated ${onReviewUpdate.modifiedCount} users on review → isEmailVerified: false, verificationStatus: 'on_review'`,
        );

        // Case 3: Users with isEmailVerified as false, 'unverified', or null
        const unverifiedUpdate = await User.updateMany(
            {
                $or: [
                    { isEmailVerified: false },
                    { isEmailVerified: 'unverified' },
                    { isEmailVerified: null },
                    { isEmailVerified: { $exists: false } },
                ],
            },
            {
                $set: {
                    isEmailVerified: false,
                    verificationStatus: 'unverified',
                },
            },
        );
        console.log(
            `✓ Updated ${unverifiedUpdate.modifiedCount} unverified users → isEmailVerified: false, verificationStatus: 'unverified'`,
        );

        // Case 4: Ensure all users have verificationStatus (catch any missed)
        const missingStatusUpdate = await User.updateMany(
            { verificationStatus: { $exists: false } },
            {
                $set: {
                    verificationStatus: 'unverified',
                    isEmailVerified: false,
                },
            },
        );
        if (missingStatusUpdate.modifiedCount > 0) {
            console.log(
                `✓ Updated ${missingStatusUpdate.modifiedCount} users missing verificationStatus → 'unverified'`,
            );
        }

        // Verify migration
        const finalCounts = await User.aggregate([
            {
                $group: {
                    _id: '$verificationStatus',
                    count: { $sum: 1 },
                },
            },
        ]).toArray();

        console.log('\n📈 Final verification status distribution:');
        finalCounts.forEach((item) => {
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
