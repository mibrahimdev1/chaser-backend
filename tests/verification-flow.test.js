/**
 * Test suite for User Verification Flow
 * This tests the automatic verification status management
 */

const request = require('supertest');
const { faker } = require('@faker-js/faker');
const httpStatus = require('http-status');
const app = require('../src/app');
const { User } = require('../src/models');
const setupTestDB = require('./utils/setupTestDB');
const { userOne, admin, insertUsers } = require('./fixtures/user.fixture');
const { userOneAccessToken, adminAccessToken } = require('./fixtures/token.fixture');

setupTestDB();

describe('User Verification Flow', () => {
    let newUser;
    let newUserAccessToken;

    beforeEach(async () => {
        await insertUsers([userOne, admin]);
    });

    describe('Automatic Status: Unverified', () => {
        test('should set isEmailVerified to unverified when both documents are null', async () => {
            const res = await request(app)
                .patch('/v1/users/profile')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({
                    firstName: 'Test',
                    driverLicense: null,
                    passport: null,
                })
                .expect(httpStatus.OK);

            expect(res.body.user.isEmailVerified).toBe('unverified');
            expect(res.body.message).toContain('Please upload verification documents');
        });

        test('should set isEmailVerified to unverified when documents are empty strings', async () => {
            const res = await request(app)
                .patch('/v1/users/profile')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({
                    firstName: 'Test',
                    driverLicense: '',
                    passport: '',
                })
                .expect(httpStatus.OK);

            expect(res.body.user.isEmailVerified).toBe('unverified');
        });
    });

    describe('Automatic Status: On Review', () => {
        test('should set isEmailVerified to on_review when driver license is uploaded', async () => {
            const res = await request(app)
                .patch('/v1/users/profile')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({
                    firstName: 'Test',
                    driverLicense: 'https://example.com/license.jpg',
                })
                .expect(httpStatus.OK);

            expect(res.body.user.isEmailVerified).toBe('on_review');
            expect(res.body.user.driverLicense).toBe('https://example.com/license.jpg');
            expect(res.body.message).toContain('under review');
        });

        test('should set isEmailVerified to on_review when passport is uploaded', async () => {
            const res = await request(app)
                .patch('/v1/users/profile')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({
                    firstName: 'Test',
                    passport: 'https://example.com/passport.jpg',
                })
                .expect(httpStatus.OK);

            expect(res.body.user.isEmailVerified).toBe('on_review');
            expect(res.body.user.passport).toBe('https://example.com/passport.jpg');
        });

        test('should set isEmailVerified to on_review when both documents are uploaded', async () => {
            const res = await request(app)
                .patch('/v1/users/profile')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({
                    firstName: 'Test',
                    driverLicense: 'https://example.com/license.jpg',
                    passport: 'https://example.com/passport.jpg',
                })
                .expect(httpStatus.OK);

            expect(res.body.user.isEmailVerified).toBe('on_review');
            expect(res.body.user.driverLicense).toBe('https://example.com/license.jpg');
            expect(res.body.user.passport).toBe('https://example.com/passport.jpg');
        });
    });

    describe('Admin Verification', () => {
        beforeEach(async () => {
            // Upload documents first
            await request(app).patch('/v1/users/profile').set('Authorization', `Bearer ${userOneAccessToken}`).send({
                driverLicense: 'https://example.com/license.jpg',
            });
        });

        test('should allow admin to verify user', async () => {
            const res = await request(app)
                .patch(`/v1/users/${userOne._id}/verification`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send({
                    isEmailVerified: 'verified',
                })
                .expect(httpStatus.OK);

            expect(res.body.user.isEmailVerified).toBe('verified');
            expect(res.body.message).toContain('verified');
        });

        test('should allow admin to reject user with reason', async () => {
            const res = await request(app)
                .patch(`/v1/users/${userOne._id}/verification`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send({
                    isEmailVerified: 'unverified',
                    rejectionReason: 'Document is blurry',
                })
                .expect(httpStatus.OK);

            expect(res.body.user.isEmailVerified).toBe('unverified');
            expect(res.body.user.rejectionReason).toBe('Document is blurry');
        });
    });

    describe('Automatic Revert After Deletion', () => {
        beforeEach(async () => {
            // Upload documents
            await request(app).patch('/v1/users/profile').set('Authorization', `Bearer ${userOneAccessToken}`).send({
                driverLicense: 'https://example.com/license.jpg',
            });

            // Admin verifies
            await request(app)
                .patch(`/v1/users/${userOne._id}/verification`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send({
                    isEmailVerified: 'verified',
                });
        });

        test('should revert to unverified when verified user removes all documents', async () => {
            const res = await request(app)
                .patch('/v1/users/profile')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({
                    driverLicense: null,
                    passport: null,
                })
                .expect(httpStatus.OK);

            expect(res.body.user.isEmailVerified).toBe('unverified');
            expect(res.body.user.driverLicense).toBeNull();
            expect(res.body.user.passport).toBeNull();
            expect(res.body.message).toContain('Please upload verification documents');
        });

        test('should clear rejection reason when documents are removed', async () => {
            // First, admin rejects with reason
            await request(app)
                .patch(`/v1/users/${userOne._id}/verification`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send({
                    isEmailVerified: 'unverified',
                    rejectionReason: 'Document is blurry',
                });

            // User removes documents
            const res = await request(app)
                .patch('/v1/users/profile')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({
                    driverLicense: null,
                })
                .expect(httpStatus.OK);

            expect(res.body.user.rejectionReason).toBeNull();
        });
    });

    describe('Edge Cases', () => {
        test('should not change verification status if already verified and uploading new documents', async () => {
            // Upload and get verified
            await request(app).patch('/v1/users/profile').set('Authorization', `Bearer ${userOneAccessToken}`).send({
                driverLicense: 'https://example.com/license.jpg',
            });

            await request(app)
                .patch(`/v1/users/${userOne._id}/verification`)
                .set('Authorization', `Bearer ${adminAccessToken}`)
                .send({
                    isEmailVerified: 'verified',
                });

            // Upload another document (should stay verified)
            const res = await request(app)
                .patch('/v1/users/profile')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({
                    passport: 'https://example.com/passport.jpg',
                })
                .expect(httpStatus.OK);

            // Should remain verified since user was already verified
            expect(res.body.user.isEmailVerified).toBe('verified');
        });

        test('should handle profile update without document changes', async () => {
            const res = await request(app)
                .patch('/v1/users/profile')
                .set('Authorization', `Bearer ${userOneAccessToken}`)
                .send({
                    firstName: 'UpdatedName',
                    bio: 'Updated bio',
                })
                .expect(httpStatus.OK);

            expect(res.body.user.firstName).toBe('UpdatedName');
            // Verification status should remain unchanged if no documents are modified
        });
    });
});
