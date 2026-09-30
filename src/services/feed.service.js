const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { Feed, Comment, User, Group, Company, UserConnection } = require('../models');
const ApiError = require('../utils/ApiError');
const groupService = require('./group.service');
/**
 * Fetches a list of feeds based on the provided filters.
 *
 * @param {string} userId - The ID of the user to fetch feeds for.
 * @param {string} postType - The type of posts to filter by.
 * @param {string} search - The search term to filter posts by using MongoDB full-text search.
 * @param {number} limit - The maximum number of posts to fetch.
 * @param {string} cursor - The cursor for pagination, representing the date to fetch posts before.
 * @returns {Promise<{posts: Array, nextCursor: string|null}>} An object containing the list of posts and the next cursor for pagination.
 */

// const getFeeds = async (userId, postType, search, limit, cursor, groupId, companyId, role = 'user', currentUserId) => {
//   // Build the match query
//   const match = {};
//   if (role === 'user') {
//     match.status = 'published';
//   }

//   // If currentUserId is provided, filter posts to show only current user's and friends' posts
//   if (userId && currentUserId) {
//     // If viewing own profile, show ALL posts (public and private)
//     if (userId === currentUserId) {
//       match.userId = mongoose.Types.ObjectId(userId);
//     }
//     // If the current user is an admin, allow them to view any user's posts
//     else if (role === 'admin') {
//       match.userId = mongoose.Types.ObjectId(userId);
//     } else {
//       // For regular users, check if there's a connection between userId and currentUserId
//       const directConnection = await UserConnection.findOne({
//         $or: [
//           { sender: mongoose.Types.ObjectId(userId), status: 'accepted', receiver: mongoose.Types.ObjectId(currentUserId) },
//           { receiver: mongoose.Types.ObjectId(userId), status: 'accepted', sender: mongoose.Types.ObjectId(currentUserId) }
//         ]
//       });

//       // Show posts from the user if connected OR if the posts are public
//       if (!directConnection) {
//         match.userId = mongoose.Types.ObjectId(userId);
//         match.isPublic = true; // Only show public posts if not connected
//       } else {
//         match.userId = mongoose.Types.ObjectId(userId);
//       }
//     }
//   }
//   else if (currentUserId) {
//     // Get all users that the current user is connected with (accepted connections)
//     const friendConnections = await UserConnection.find({
//       $or: [
//         { sender: mongoose.Types.ObjectId(currentUserId), status: 'accepted' },
//         { receiver: mongoose.Types.ObjectId(currentUserId), status: 'accepted' }
//       ]
//     });

//     // Extract friend user IDs
//     const friendUserIds = friendConnections.map(conn => {
//       return conn.sender.toString() === currentUserId ? conn.receiver : conn.sender;
//     });

//     // Include current user ID and all friend IDs
//     const allowedUserIds = [mongoose.Types.ObjectId(currentUserId), ...friendUserIds.map(id => mongoose.Types.ObjectId(id))];

//     // Show posts from friends OR public posts
//     match.$or = [
//       { userId: { $in: allowedUserIds } },
//       { isPublic: true }
//     ];
//   }

//   if (groupId) {
//     match.groupId = mongoose.Types.ObjectId(groupId);
//   }
//   if (companyId) {
//     match.companyId = mongoose.Types.ObjectId(companyId);
//   }
//   if (postType) {
//     match.postType = postType === 'video' ? 'media' : postType;
//   }
//   if (search) {
//     match.$text = { $search: search };
//   }
//   if (cursor) {
//     match.createdAt = { $lte: new Date(cursor) };
//   }

//   // Build the aggregation pipeline
//   const pipeline = [
//     { $match: match },
//     // Sort by creation date only (latest first)
//     { $sort: { createdAt: -1 } },
//     { $limit: parseInt(limit, 10) + 1 },

//     // Ensure likes is treated as an array
//     {
//       $addFields: {
//         likes: { $ifNull: ['$likes', []] },
//       },
//     },

//     // Lookup user details for likes
//     {
//       $lookup: {
//         from: 'users',
//         localField: 'likes.userId',
//         foreignField: '_id',
//         as: 'likesUsers',
//       },
//     },

//     // Merge user details into likes array
//     {
//       $addFields: {
//         likes: {
//           $map: {
//             input: '$likes',
//             as: 'like',
//             in: {
//               _id: '$$like._id',
//               type: '$$like.type',
//               userId: {
//                 $let: {
//                   vars: {
//                     user: {
//                       $arrayElemAt: [
//                         {
//                           $filter: {
//                             input: '$likesUsers',
//                             as: 'user',
//                             cond: { $eq: ['$$user._id', '$$like.userId'] },
//                           },
//                         },
//                         0,
//                       ],
//                     },
//                   },
//                   in: {
//                     _id: '$$user._id',
//                     firstName: '$$user.firstName',
//                     lastName: '$$user.lastName',
//                     profilePicture: '$$user.profilePicture',
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },

//     // Remove temporary lookup array
//     { $project: { likesUsers: 0 } },

//     {
//       $lookup: {
//         from: 'groups',
//         localField: 'groupId',
//         foreignField: '_id',
//         as: 'group',
//       },
//     },
//     { $unwind: { path: '$group', preserveNullAndEmptyArrays: true } },

//     // Populate company data if companyId exists
//     {
//       $lookup: {
//         from: 'companies',
//         localField: 'companyId',
//         foreignField: '_id',
//         as: 'company',
//       },
//     },
//     { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },

//     // Join user data for the post creator (into temporary field "user")
//     {
//       $lookup: {
//         from: 'users',
//         localField: 'userId',
//         foreignField: '_id',
//         as: 'user',
//       },
//     },
//     { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

//     // Lookup userProfile for the post creator, fetching only the bio field
//     {
//       $lookup: {
//         from: 'userprofiles',
//         let: { userId: '$user._id' },
//         pipeline: [{ $match: { $expr: { $eq: ['$userId', '$$userId'] } } }, { $project: { bio: 1, _id: 0 } }],
//         as: 'userProfile',
//       },
//     },
//     // Add the bio field directly to the temporary "user" field
//     {
//       $addFields: {
//         'user.bio': { $arrayElemAt: ['$userProfile.bio', 0] },
//       },
//     },
//     // Remove the temporary userProfile array
//     { $project: { userProfile: 0 } },

//     // Move joined user data into "userId" field and remove temporary "user" field
//     {
//       $addFields: {
//         userId: '$user',
//       },
//     },
//     { $project: { user: 0 } },

//     // Process sharedPost.originalPost if it exists:
//     {
//       $lookup: {
//         from: 'feeds', // assuming the original post is in the Feed collection
//         localField: 'sharedPost.originalPost',
//         foreignField: '_id',
//         as: 'sharedPost.originalPost',
//       },
//     },
//     { $unwind: { path: '$sharedPost.originalPost', preserveNullAndEmptyArrays: true } },

//     // Join user data for the original post's creator (into temporary "user")
//     {
//       $lookup: {
//         from: 'users',
//         localField: 'sharedPost.originalPost.userId',
//         foreignField: '_id',
//         as: 'sharedPost.originalPost.user',
//       },
//     },
//     { $unwind: { path: '$sharedPost.originalPost.user', preserveNullAndEmptyArrays: true } },

//     // Lookup userProfile for the original post's creator, fetching only the bio field
//     {
//       $lookup: {
//         from: 'userprofiles',
//         let: { userId: '$sharedPost.originalPost.user._id' },
//         pipeline: [{ $match: { $expr: { $eq: ['$userId', '$$userId'] } } }, { $project: { bio: 1, _id: 0 } }],
//         as: 'originalUserProfile',
//       },
//     },
//     {
//       $addFields: {
//         'sharedPost.originalPost.user.bio': { $arrayElemAt: ['$originalUserProfile.bio', 0] },
//       },
//     },
//     { $project: { originalUserProfile: 0 } },

//     // Move the joined shared post user data into "userId" field and remove temporary "user" field
//     {
//       $addFields: {
//         'sharedPost.originalPost.userId': '$sharedPost.originalPost.user',
//       },
//     },
//     { $project: { 'sharedPost.originalPost.user': 0 } },

//     {
//       $lookup: {
//         from: 'users',
//         let: { ids: { $ifNull: ['$sharedPost.originalPost.taggedUsers', []] } },
//         pipeline: [{ $match: { $expr: { $in: ['$_id', '$$ids'] } } }, { $project: { _id: 1, displayName: 1 } }],
//         as: 'sharedPost_originalPost_taggedUsers',
//       },
//     },
//     {
//       $lookup: {
//         from: 'groups',
//         let: { ids: { $ifNull: ['$sharedPost.originalPost.taggedGroups', []] } },
//         pipeline: [{ $match: { $expr: { $in: ['$_id', '$$ids'] } } }, { $project: { _id: 1, name: 1 } }],
//         as: 'sharedPost_originalPost_taggedGroups',
//       },
//     },
//     {
//       $lookup: {
//         from: 'companies',
//         let: { ids: { $ifNull: ['$sharedPost.originalPost.taggedCompanies', []] } },
//         pipeline: [{ $match: { $expr: { $in: ['$_id', '$$ids'] } } }, { $project: { _id: 1, name: 1 } }],
//         as: 'sharedPost_originalPost_taggedCompanies',
//       },
//     },
//     {
//       $set: {
//         'sharedPost.originalPost.taggedUsers': '$sharedPost_originalPost_taggedUsers',
//         'sharedPost.originalPost.taggedGroups': '$sharedPost_originalPost_taggedGroups',
//         'sharedPost.originalPost.taggedCompanies': '$sharedPost_originalPost_taggedCompanies',
//       },
//     },
//     {
//       $unset: [
//         'sharedPost_originalPost_taggedUsers',
//         'sharedPost_originalPost_taggedGroups',
//         'sharedPost_originalPost_taggedCompanies',
//       ],
//     },

//     {
//       $lookup: {
//         from: 'users',
//         localField: 'taggedUsers',
//         foreignField: '_id',
//         pipeline: [
//           {
//             $project: {
//               _id: 1,
//               displayName: 1,
//             },
//           },
//         ],
//         as: 'taggedUsers',
//       },
//     },
//     {
//       $lookup: {
//         from: 'groups',
//         localField: 'taggedGroups',
//         foreignField: '_id',
//         pipeline: [
//           {
//             $project: {
//               _id: 1,
//               name: 1,
//             },
//           },
//         ],
//         as: 'taggedGroups',
//       },
//     },
//     {
//       $lookup: {
//         from: 'companies',
//         localField: 'taggedCompanies',
//         foreignField: '_id',
//         pipeline: [
//           {
//             $project: {
//               _id: 1,
//               name: 1,
//             },
//           },
//         ],
//         as: 'taggedCompanies',
//       },
//     },
//   ];

//   // Execute the aggregation
//   let feeds = await Feed.aggregate(pipeline);
//   // Loop and console log whose post is not in the list from allowedUserIds
//   if (postType === 'video') {
//     feeds = feeds.filter((feed) => feed.media && feed.media.length === 1 && feed.media[0].type === 'video');
//   }
//   // else {
//   //   feeds = feeds.filter((feed) => !(feed.media && feed.media.length === 1 && feed.media[0].type === 'video'));
//   // }
//   // Determine the next cursor if there are more posts than the requested limit
//   let nextCursor = null;
//   if (feeds.length > limit) {
//     nextCursor = feeds.pop().createdAt.toISOString();
//   }
//   return { posts: feeds, nextCursor };
// };

const getFeeds = async (
    userId,
    postType,
    search,
    limit,
    cursor,
    groupId,
    companyId,
    role = 'user',
    currentUserId,
    timezone = 'UTC', // NEW: timezone parameter
    page = null, // NEW: page parameter for pagination
) => {
    const match = {};
    if (role === 'user') match.status = 'published';

    // Filter based on connections and visibility
    if (userId && currentUserId) {
        if (userId === currentUserId || role === 'admin') {
            match.userId = mongoose.Types.ObjectId(userId);
            // Exclude group posts when filtering by userId (unless groupId is also specified)
            if (!groupId) {
                match.$or = [{ groupId: { $exists: false } }, { groupId: null }];
            }
        } else {
            const directConnection = await UserConnection.findOne({
                $or: [
                    {
                        sender: mongoose.Types.ObjectId(userId),
                        status: 'accepted',
                        receiver: mongoose.Types.ObjectId(currentUserId),
                    },
                    {
                        receiver: mongoose.Types.ObjectId(userId),
                        status: 'accepted',
                        sender: mongoose.Types.ObjectId(currentUserId),
                    },
                ],
            });
            if (!directConnection) {
                match.userId = mongoose.Types.ObjectId(userId);
                match.isPublic = true;
                // Exclude group posts when filtering by userId (unless groupId is also specified)
                if (!groupId) {
                    match.$or = [{ groupId: { $exists: false } }, { groupId: null }];
                }
            } else {
                match.userId = mongoose.Types.ObjectId(userId);
                // Exclude group posts when filtering by userId (unless groupId is also specified)
                if (!groupId) {
                    match.$or = [{ groupId: { $exists: false } }, { groupId: null }];
                }
            }
        }
    } else if (currentUserId) {
        const friendConnections = await UserConnection.find({
            $or: [
                { sender: mongoose.Types.ObjectId(currentUserId), status: 'accepted' },
                { receiver: mongoose.Types.ObjectId(currentUserId), status: 'accepted' },
            ],
        });

        const friendUserIds = friendConnections.map((conn) =>
            conn.sender.toString() === currentUserId ? conn.receiver : conn.sender,
        );
        const allowedUserIds = [
            mongoose.Types.ObjectId(currentUserId),
            ...friendUserIds.map((id) => mongoose.Types.ObjectId(id)),
        ];

        match.$or = [{ userId: { $in: allowedUserIds } }, { isPublic: true }];
    }

    if (groupId) match.groupId = mongoose.Types.ObjectId(groupId);
    if (companyId) match.companyId = mongoose.Types.ObjectId(companyId);
    if (postType) match.postType = postType === 'video' ? 'media' : postType;
    if (search) match.$text = { $search: search };

    // Only apply cursor filter if page is not provided (cursor-based pagination)
    if (cursor && !page) match.createdAt = { $lte: new Date(cursor) };

    const limitNum = parseInt(limit, 10);
    const isPageBased = page !== null && page !== undefined;

    // Aggregation pipeline
    const pipeline = [
        { $match: match },
        { $sort: { createdAt: -1 } }, // Always sort by createdAt descending
    ];

    // Add skip for page-based pagination
    if (isPageBased) {
        const skip = (parseInt(page, 10) - 1) * limitNum;
        pipeline.push({ $skip: skip });
    }

    // Add limit (for cursor-based, add +1 to check for next page)
    pipeline.push({ $limit: isPageBased ? limitNum : limitNum + 1 });

    // Keep original createdAt for cursor, add formatted version
    pipeline.push({
        $addFields: {
            createdAtOriginal: '$createdAt',
            createdAt: {
                $dateToString: { date: '$createdAt', timezone: timezone, format: '%Y-%m-%dT%H:%M:%S.%L' },
            },
        },
    });

    // Ensure likes array exists
    pipeline.push({ $addFields: { likes: { $ifNull: ['$likes', []] } } });

    // Lookup likes users
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'likes.userId',
            foreignField: '_id',
            as: 'likesUsers',
        },
    });

    // Lookup userprofiles for likes users
    pipeline.push({
        $lookup: {
            from: 'userprofiles',
            localField: 'likesUsers._id',
            foreignField: 'userId',
            as: 'likesUsersProfiles',
        },
    });

    pipeline.push({
        $addFields: {
            likes: {
                $map: {
                    input: '$likes',
                    as: 'like',
                    in: {
                        _id: '$$like._id',
                        type: '$$like.type',
                        userId: {
                            $let: {
                                vars: {
                                    user: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$likesUsers',
                                                    as: 'user',
                                                    cond: { $eq: ['$$user._id', '$$like.userId'] },
                                                },
                                            },
                                            0,
                                        ],
                                    },
                                    profile: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$likesUsersProfiles',
                                                    as: 'profile',
                                                    cond: { $eq: ['$$profile.userId', '$$like.userId'] },
                                                },
                                            },
                                            0,
                                        ],
                                    },
                                },
                                in: {
                                    _id: '$$user._id',
                                    firstName: '$$user.firstName',
                                    lastName: '$$user.lastName',
                                    profilePicture: '$$user.profilePicture',
                                    displayName: '$$user.displayName',
                                    username: { $ifNull: ['$$profile.username', null] },
                                },
                            },
                        },
                    },
                },
            },
        },
    });

    pipeline.push({ $project: { likesUsers: 0, likesUsersProfiles: 0 } });

    // Lookup groups & companies
    pipeline.push({ $lookup: { from: 'groups', localField: 'groupId', foreignField: '_id', as: 'group' } });
    pipeline.push({ $unwind: { path: '$group', preserveNullAndEmptyArrays: true } });
    pipeline.push({ $lookup: { from: 'companies', localField: 'companyId', foreignField: '_id', as: 'company' } });
    pipeline.push({ $unwind: { path: '$company', preserveNullAndEmptyArrays: true } });

    // Lookup post creator
    pipeline.push({ $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } });
    pipeline.push({ $unwind: { path: '$user', preserveNullAndEmptyArrays: true } });
    pipeline.push({
        $lookup: {
            from: 'userprofiles',
            let: { userId: '$user._id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$userId', '$$userId'] } } },
                { $project: { bio: 1, username: 1, _id: 0 } },
            ],
            as: 'userProfile',
        },
    });
    pipeline.push({
        $addFields: {
            'user.bio': { $arrayElemAt: ['$userProfile.bio', 0] },
            'user.username': { $arrayElemAt: ['$userProfile.username', 0] },
        },
    });
    pipeline.push({ $project: { userProfile: 0 } });
    pipeline.push({ $addFields: { userId: '$user' } });
    pipeline.push({ $project: { user: 0 } });

    // Process shared post
    pipeline.push({
        $lookup: {
            from: 'feeds',
            localField: 'sharedPost.originalPost',
            foreignField: '_id',
            as: 'sharedPost.originalPost',
        },
    });
    pipeline.push({ $unwind: { path: '$sharedPost.originalPost', preserveNullAndEmptyArrays: true } });

    // Convert sharedPost originalPost createdAt
    pipeline.push({
        $addFields: {
            'sharedPost.originalPost.createdAtLocal': {
                $dateToString: {
                    date: '$sharedPost.originalPost.createdAt',
                    timezone: timezone,
                    format: '%Y-%m-%dT%H:%M:%S.%L',
                },
            },
        },
    });

    // Lookup sharedPost original post user & bio
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'sharedPost.originalPost.userId',
            foreignField: '_id',
            as: 'sharedPost.originalPost.user',
        },
    });
    pipeline.push({ $unwind: { path: '$sharedPost.originalPost.user', preserveNullAndEmptyArrays: true } });
    pipeline.push({
        $lookup: {
            from: 'userprofiles',
            let: { userId: '$sharedPost.originalPost.user._id' },
            pipeline: [
                { $match: { $expr: { $eq: ['$userId', '$$userId'] } } },
                { $project: { bio: 1, username: 1, _id: 0 } },
            ],
            as: 'originalUserProfile',
        },
    });
    pipeline.push({
        $addFields: {
            'sharedPost.originalPost.user.bio': { $arrayElemAt: ['$originalUserProfile.bio', 0] },
            'sharedPost.originalPost.user.username': { $arrayElemAt: ['$originalUserProfile.username', 0] },
        },
    });
    pipeline.push({ $project: { originalUserProfile: 0 } });
    pipeline.push({ $addFields: { 'sharedPost.originalPost.userId': '$sharedPost.originalPost.user' } });
    pipeline.push({ $project: { 'sharedPost.originalPost.user': 0 } });

    // Lookup sharedPost tags
    pipeline.push({
        $lookup: {
            from: 'users',
            let: { ids: { $ifNull: ['$sharedPost.originalPost.taggedUsers', []] } },
            pipeline: [
                { $match: { $expr: { $in: ['$_id', '$$ids'] } } },
                {
                    $lookup: {
                        from: 'userprofiles',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'userProfile',
                    },
                },
                { $unwind: { path: '$userProfile', preserveNullAndEmptyArrays: true } },
                { $project: { _id: 1, displayName: 1, username: '$userProfile.username' } },
            ],
            as: 'sharedPost_originalPost_taggedUsers',
        },
    });
    pipeline.push({
        $lookup: {
            from: 'groups',
            let: { ids: { $ifNull: ['$sharedPost.originalPost.taggedGroups', []] } },
            pipeline: [{ $match: { $expr: { $in: ['$_id', '$$ids'] } } }, { $project: { _id: 1, name: 1 } }],
            as: 'sharedPost_originalPost_taggedGroups',
        },
    });
    pipeline.push({
        $lookup: {
            from: 'companies',
            let: { ids: { $ifNull: ['$sharedPost.originalPost.taggedCompanies', []] } },
            pipeline: [{ $match: { $expr: { $in: ['$_id', '$$ids'] } } }, { $project: { _id: 1, name: 1 } }],
            as: 'sharedPost_originalPost_taggedCompanies',
        },
    });
    pipeline.push({
        $set: {
            'sharedPost.originalPost.taggedUsers': '$sharedPost_originalPost_taggedUsers',
            'sharedPost.originalPost.taggedGroups': '$sharedPost_originalPost_taggedGroups',
            'sharedPost.originalPost.taggedCompanies': '$sharedPost_originalPost_taggedCompanies',
        },
    });
    pipeline.push({
        $unset: [
            'sharedPost_originalPost_taggedUsers',
            'sharedPost_originalPost_taggedGroups',
            'sharedPost_originalPost_taggedCompanies',
        ],
    });

    // Lookup post tags
    pipeline.push({
        $lookup: {
            from: 'users',
            localField: 'taggedUsers',
            foreignField: '_id',
            pipeline: [
                { $project: { _id: 1, displayName: 1 } },
                {
                    $lookup: {
                        from: 'userprofiles',
                        localField: '_id',
                        foreignField: 'userId',
                        as: 'userProfile',
                    },
                },
                { $unwind: { path: '$userProfile', preserveNullAndEmptyArrays: true } },
                { $project: { _id: 1, displayName: 1, username: '$userProfile.username' } },
            ],
            as: 'taggedUsers',
        },
    });
    pipeline.push({
        $lookup: {
            from: 'groups',
            localField: 'taggedGroups',
            foreignField: '_id',
            pipeline: [{ $project: { _id: 1, name: 1 } }],
            as: 'taggedGroups',
        },
    });
    pipeline.push({
        $lookup: {
            from: 'companies',
            localField: 'taggedCompanies',
            foreignField: '_id',
            pipeline: [{ $project: { _id: 1, name: 1 } }],
            as: 'taggedCompanies',
        },
    });

    let feeds = await Feed.aggregate(pipeline);

    if (postType === 'video') {
        feeds = feeds.filter((feed) => feed.media && feed.media.length === 1 && feed.media[0].type === 'video');
    }

    let nextCursor = null;
    // Only calculate nextCursor for cursor-based pagination (when page is not provided)
    if (!isPageBased && feeds.length > limitNum) {
        const lastFeed = feeds.pop();
        // Use createdAtOriginal if available (Date object), otherwise convert createdAt string back to Date
        if (lastFeed.createdAtOriginal) {
            nextCursor = new Date(lastFeed.createdAtOriginal).toISOString();
        } else if (lastFeed.createdAt) {
            // If createdAtOriginal doesn't exist, try to parse the string
            const dateValue = new Date(lastFeed.createdAt);
            nextCursor = isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
        }
    }

    // Remove temporary createdAtOriginal field from all feeds
    feeds.forEach((feed) => {
        if (feed.createdAtOriginal) {
            delete feed.createdAtOriginal;
        }
    });

    // Calculate total posts count for company if companyId is provided
    let postsCount = null;
    if (companyId) {
        const countMatch = { companyId: mongoose.Types.ObjectId(companyId) };
        if (role === 'user') {
            countMatch.status = 'published';
        }
        if (postType) {
            countMatch.postType = postType === 'video' ? 'media' : postType;
        }
        if (postType === 'video') {
            // For video posts, we need to count only posts with single video media
            const allFeeds = await Feed.find(countMatch);
            postsCount = allFeeds.filter(
                (feed) => feed.media && feed.media.length === 1 && feed.media[0].type === 'video',
            ).length;
        } else {
            postsCount = await Feed.countDocuments(countMatch);
        }
    }

    return { posts: feeds, nextCursor, postsCount };
};

/**
 * Validates and categorizes tag IDs into users, groups, and companies.
 * @param {Object} tags - Object with tag names as keys and ObjectIds as values (e.g., { "@noobmaster69": "12345678810" }).
 * @returns {Promise<{taggedUsers: Array, taggedGroups: Array, taggedCompanies: Array}>} - Arrays of validated ObjectIds.
 */
const validateTags = async (tags) => {
    const taggedUsers = [];
    const taggedGroups = [];
    const taggedCompanies = [];

    if (!tags || !Array.isArray(tags)) {
        return { taggedUsers, taggedGroups, taggedCompanies };
    }

    await Promise.all(
        tags.map(async (tag) => {
            const { type, id, displayName } = tag;

            // Validate tag structure
            if (!type || !id || !displayName) {
                throw new ApiError(httpStatus.BAD_REQUEST, `Invalid tag structure: ${JSON.stringify(tag)}`);
            }

            // Validate ObjectId
            if (!mongoose.isValidObjectId(id)) {
                throw new ApiError(httpStatus.BAD_REQUEST, `Invalid ObjectId for tag ${displayName}`);
            }

            const objectId = new mongoose.Types.ObjectId(id);

            // Query only the model corresponding to the type
            switch (type.toLowerCase()) {
                case 'user': {
                    const user = await User.findById(objectId).select('_id');
                    if (!user) {
                        throw new ApiError(
                            httpStatus.BAD_REQUEST,
                            `No user found for tag ${displayName} with ID ${id}`,
                        );
                    }
                    taggedUsers.push(objectId);
                    break;
                }
                case 'group': {
                    const group = await Group.findById(objectId).select('_id');
                    if (!group) {
                        throw new ApiError(
                            httpStatus.BAD_REQUEST,
                            `No group found for tag ${displayName} with ID ${id}`,
                        );
                    }
                    taggedGroups.push(objectId);
                    break;
                }
                case 'company': {
                    const company = await Company.findById(objectId).select('_id');
                    if (!company) {
                        throw new ApiError(
                            httpStatus.BAD_REQUEST,
                            `No company found for tag ${displayName} with ID ${id}`,
                        );
                    }
                    taggedCompanies.push(objectId);
                    break;
                }
                default:
                    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid tag type: ${type} for tag ${displayName}`);
            }
        }),
    );

    return { taggedUsers, taggedGroups, taggedCompanies };
};

/**
 * Parses text for tags and returns ObjectIds for tagged users, groups, and companies.
 * Used for comments and replies, not posts.
 * @param {string} text - The text containing tags (e.g., @username, @groupname, @companyname).
 * @returns {Promise<{taggedUsers: Array, taggedGroups: Array, taggedCompanies: Array, unmatchedTags: Array}>} - Arrays of ObjectIds and unmatched tags.
 */
const parseTags = async (text) => {
    const taggedUsers = [];
    const taggedGroups = [];
    const taggedCompanies = [];
    const unmatchedTags = [];

    if (!text) {
        return { taggedUsers, taggedGroups, taggedCompanies, unmatchedTags };
    }

    const tagRegex = /@([^\s]+)/g;
    const matches = text.match(tagRegex) || [];
    const tags = matches.map((tag) => tag.substring(1)); // Remove '@' prefix

    await Promise.all(
        tags.map(async (tag) => {
            const user = await User.findOne({
                $or: [
                    { username: { $regex: `^${tag}$`, $options: 'i' } },
                    { displayName: { $regex: `^${tag}$`, $options: 'i' } },
                ],
            });
            if (user) {
                taggedUsers.push(user._id);
                return;
            }

            const group = await Group.findOne({
                name: { $regex: `^${tag}$`, $options: 'i' },
            });
            if (group) {
                taggedGroups.push(group._id);
                return;
            }

            const company = await Company.findOne({
                name: { $regex: `^${tag}$`, $options: 'i' },
            });
            if (company) {
                taggedCompanies.push(company._id);
                return;
            }

            unmatchedTags.push(tag);
        }),
    );

    return { taggedUsers, taggedGroups, taggedCompanies, unmatchedTags };
};

/**
 * Updates a feed post with the given payload.
 *
 * @param {string} postId - The ID of the post to update.
 * @param {Object} payload - The payload to update the post with.
 * @returns {Promise<Feed>} A promise that resolves to the updated post.
 */
const updateFeed = async (postId, payload) => {
    return await Feed.findOneAndUpdate({ _id: postId }, payload, { new: true });
};

/**
 * Retrieves comments for a given post, including user details.
 *
 * @param {string} postId - The ID of the post for which to retrieve comments.
 * @returns {Promise<Array>} A promise that resolves to an array of comments with user details.
 */
const getComments = async (postId) => {
    const comments = await Comment.find({ postId, parentId: null })
        .populate({
            path: 'userId',
            select: 'firstName lastName displayName profilePicture fcmToken',
            populate: {
                path: 'userProfile',
                select: 'username',
            },
        })
        .populate({
            path: 'taggedUsers',
            select: 'firstName lastName displayName profilePicture fcmToken',
            populate: {
                path: 'userProfile',
                select: 'username',
            },
        })
        .populate('taggedCompanies', 'name profilePicture')
        .populate('taggedGroups', 'name profilePicture')
        .lean();

    comments.forEach((comment) => {
        if (comment.userId && comment.userId.userProfile) {
            comment.userId.username = comment.userId.userProfile.username;
            delete comment.userId.userProfile;
        }
        if (comment.taggedUsers && Array.isArray(comment.taggedUsers)) {
            comment.taggedUsers.forEach((user) => {
                if (user && user.userProfile) {
                    user.username = user.userProfile.username;
                    delete user.userProfile;
                }
            });
        }
    });

    return comments;
};

/**
 * Creates a new feed post for a user.
 *
 * @param {mongoose.Schema.Types.ObjectId} userId - The ID of the user creating the feed post.
 * @param {Object} body - The body of the feed post.
 * @param {string} [body.caption] - The caption of the feed post.
 * @param {Array<Object>} [body.media] - The media associated with the feed post.
 * @param {string} body.media[].url - The URL of the media.
 * @param {string} body.media[].type - The type of the media (image, video, gif, document).
 * @param {Object} [body.poll] - The poll associated with the feed post.
 * @param {string} [body.poll.question] - The poll question.
 * @param {Array<string>} [body.poll.options] - The poll options.
 * @param {Array<Object>} [body.poll.votes] - The votes for the poll.
 * @param {mongoose.Schema.Types.ObjectId} body.poll.votes[].userId - The ID of the user who voted.
 * @param {string} body.poll.votes[].selectedOption - The selected option by the user.
 * @param {Date} [body.scheduledAt] - The scheduled time for the post to be published.
 * @param {Array<mongoose.Schema.Types.ObjectId>} [body.likes] - The IDs of users who liked the post.
 * @param {Array<mongoose.Schema.Types.ObjectId>} [body.shares] - The IDs of users who shared the post.
 * @param {Object} [body.sharedPost] - The shared post details.
 * @param {mongoose.Schema.Types.ObjectId} [body.sharedPost.originalPost] - The ID of the original post being shared.
 * @param {string} [body.sharedPost.caption] - The caption added by the user sharing the post.
 * @returns {Promise<Object>} The created feed post.
 */
// const createFeed = async (userId, body) => {
//   const { scheduledAt, caption, sharedPost, tags } = body;
//   const { taggedUsers, taggedGroups, taggedCompanies } = tags ? await validateTags(tags) : await parseTags(caption);
//   let sharedPostData = {};
//   let sharedTags = {};
//   if (sharedPost) {
//     sharedTags = sharedPost.tags ? await validateTags(sharedPost.tags) : await parseTags(sharedPost.caption);
//     sharedPostData = {
//       ...sharedPost,
//       taggedUsers: sharedTags.taggedUsers,
//       taggedGroups: sharedTags.taggedGroups,
//       taggedCompanies: sharedTags.taggedCompanies,
//     };
//   }
//   return await Feed.create({
//     userId,
//     ...body,
//     ...(sharedPost ? sharedTags : { taggedUsers, taggedGroups, taggedCompanies }),
//     sharedPost: sharedPostData,
//     status: scheduledAt ? 'scheduled' : 'published',
//   });
// };

const createFeed = async (userId, body) => {
    const { scheduledAt, caption, sharedPost, tags, groupId, createdAt } = body;

    if (groupId) {
        const isMember = await groupService.isGroupMember(groupId, userId);
        if (!isMember) {
            throw new ApiError(httpStatus.FORBIDDEN, 'You must be a member of the group to post in it');
        }
    }

    const { taggedUsers, taggedGroups, taggedCompanies } = tags ? await validateTags(tags) : await parseTags(caption);

    let sharedPostData = {};
    let sharedTags = {};

    if (sharedPost) {
        sharedTags = sharedPost.tags ? await validateTags(sharedPost.tags) : await parseTags(sharedPost.caption);

        sharedPostData = {
            ...sharedPost,
            taggedUsers: sharedTags.taggedUsers,
            taggedGroups: sharedTags.taggedGroups,
            taggedCompanies: sharedTags.taggedCompanies,
        };
    }

    const finalFeed = {
        userId,
        ...body,
        ...(sharedPost ? sharedTags : { taggedUsers, taggedGroups, taggedCompanies }),
        sharedPost: sharedPostData,
        status: scheduledAt ? 'scheduled' : 'published',
        createdAt: createdAt,
    };
    const createdFeed = await Feed.create(finalFeed);

    return createdFeed;
};

/**
 * Finds a feed by its ID.
 *
 * @param {string} id - The ID of the feed to find.
 * @returns {Promise<Object|null>} A promise that resolves to the feed object if found, or null if not found.
 */
const findFeedById = async (id) => {
    return await Feed.findById(id).populate('userId');
};

const findFeed = async (feedId) => {
    const pipeline = [
        // Match the specific feed by its ID
        { $match: { _id: mongoose.Types.ObjectId(feedId) } },

        // Ensure likes is treated as an array
        {
            $addFields: {
                likes: { $ifNull: ['$likes', []] },
            },
        },

        // Lookup user details for likes
        {
            $lookup: {
                from: 'users',
                localField: 'likes.userId',
                foreignField: '_id',
                as: 'likesUsers',
            },
        },

        // Lookup userprofiles for likes users
        {
            $lookup: {
                from: 'userprofiles',
                localField: 'likesUsers._id',
                foreignField: 'userId',
                as: 'likesUsersProfiles',
            },
        },

        // Merge user details into likes array
        {
            $addFields: {
                likes: {
                    $map: {
                        input: '$likes',
                        as: 'like',
                        in: {
                            _id: '$$like._id',
                            type: '$$like.type',
                            userId: {
                                $let: {
                                    vars: {
                                        user: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$likesUsers',
                                                        as: 'user',
                                                        cond: { $eq: ['$$user._id', '$$like.userId'] },
                                                    },
                                                },
                                                0,
                                            ],
                                        },
                                        profile: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: '$likesUsersProfiles',
                                                        as: 'profile',
                                                        cond: { $eq: ['$$profile.userId', '$$like.userId'] },
                                                    },
                                                },
                                                0,
                                            ],
                                        },
                                    },
                                    in: {
                                        _id: '$$user._id',
                                        firstName: '$$user.firstName',
                                        lastName: '$$user.lastName',
                                        profilePicture: '$$user.profilePicture',
                                        displayName: '$$user.displayName',
                                        username: { $ifNull: ['$$profile.username', null] },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        { $project: { likesUsersProfiles: 0 } },

        // Populate group data if groupId exists
        {
            $lookup: {
                from: 'groups',
                localField: 'groupId',
                foreignField: '_id',
                as: 'group',
            },
        },
        { $unwind: { path: '$group', preserveNullAndEmptyArrays: true } },

        // Populate company data if companyId exists
        {
            $lookup: {
                from: 'companies',
                localField: 'companyId',
                foreignField: '_id',
                as: 'company',
            },
        },
        { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },

        // Join user data for the post creator (into temporary field "user")
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user',
            },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

        // Lookup userProfile for the post creator, fetching bio and username
        {
            $lookup: {
                from: 'userprofiles',
                let: { userId: '$user._id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$userId', '$$userId'] } } },
                    { $project: { bio: 1, username: 1, _id: 0 } },
                ],
                as: 'userProfile',
            },
        },
        // Add the bio and username fields directly to the temporary "user" field
        {
            $addFields: {
                'user.bio': { $arrayElemAt: ['$userProfile.bio', 0] },
                'user.username': { $arrayElemAt: ['$userProfile.username', 0] },
            },
        },
        // Remove the temporary userProfile array
        { $project: { userProfile: 0 } },

        // Move joined user data into "userId" field and remove temporary "user" field
        {
            $addFields: {
                userId: '$user',
                companyId: '$company',
                groupId: '$group',
            },
        },
        { $project: { user: 0 } },

        // Process sharedPost.originalPost if it exists:
        {
            $lookup: {
                from: 'feeds', // assuming the original post is in the Feed collection
                localField: 'sharedPost.originalPost',
                foreignField: '_id',
                as: 'sharedPost.originalPost',
            },
        },
        { $unwind: { path: '$sharedPost.originalPost', preserveNullAndEmptyArrays: true } },

        // Join user data for the original post's creator (into temporary "user")
        {
            $lookup: {
                from: 'users',
                localField: 'sharedPost.originalPost.userId',
                foreignField: '_id',
                as: 'sharedPost.originalPost.user',
            },
        },
        { $unwind: { path: '$sharedPost.originalPost.user', preserveNullAndEmptyArrays: true } },

        // Lookup userProfile for the original post's creator, fetching bio and username
        {
            $lookup: {
                from: 'userprofiles',
                let: { userId: '$sharedPost.originalPost.user._id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$userId', '$$userId'] } } },
                    { $project: { bio: 1, username: 1, _id: 0 } },
                ],
                as: 'originalUserProfile',
            },
        },
        {
            $addFields: {
                'sharedPost.originalPost.user.bio': { $arrayElemAt: ['$originalUserProfile.bio', 0] },
                'sharedPost.originalPost.user.username': { $arrayElemAt: ['$originalUserProfile.username', 0] },
            },
        },
        { $project: { originalUserProfile: 0 } },

        // Move the joined shared post user data into "userId" field and remove temporary "user" field
        {
            $addFields: {
                'sharedPost.originalPost.userId': '$sharedPost.originalPost.user',
            },
        },
        { $project: { 'sharedPost.originalPost.user': 0 } },

        // extract user data from taggedUsers, taggedGroups, and taggedCompanies

        {
            $lookup: {
                from: 'users',
                localField: 'taggedUsers',
                foreignField: '_id',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            displayName: 1,
                        },
                    },
                    {
                        $lookup: {
                            from: 'userprofiles',
                            localField: '_id',
                            foreignField: 'userId',
                            as: 'userProfile',
                        },
                    },
                    {
                        $unwind: { path: '$userProfile', preserveNullAndEmptyArrays: true },
                    },
                    {
                        $project: {
                            _id: 1,
                            displayName: 1,
                            username: '$userProfile.username',
                        },
                    },
                ],
                as: 'taggedUsers',
            },
        },
        {
            $lookup: {
                from: 'groups',
                localField: 'taggedGroups',
                foreignField: '_id',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                        },
                    },
                ],
                as: 'taggedGroups',
            },
        },
        {
            $lookup: {
                from: 'companies',
                localField: 'taggedCompanies',
                foreignField: '_id',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                        },
                    },
                ],
                as: 'taggedCompanies',
            },
        },

        {
            $lookup: {
                from: 'users',
                let: { ids: { $ifNull: ['$sharedPost.originalPost.taggedUsers', []] } },
                pipeline: [
                    { $match: { $expr: { $in: ['$_id', '$$ids'] } } },
                    { $project: { _id: 1, displayName: 1 } },
                    {
                        $lookup: {
                            from: 'userprofiles',
                            localField: '_id',
                            foreignField: 'userId',
                            as: 'userProfile',
                        },
                    },
                    { $unwind: { path: '$userProfile', preserveNullAndEmptyArrays: true } },
                    { $project: { _id: 1, displayName: 1, username: '$userProfile.username' } },
                ],
                as: 'sharedPost_originalPost_taggedUsers',
            },
        },
        {
            $addFields: {
                'sharedPost.originalPost.taggedUsers': '$sharedPost_originalPost_taggedUsers',
            },
        },
        { $project: { sharedPost_originalPost_taggedUsers: 0 } },
        {
            $lookup: {
                from: 'groups',
                let: { ids: { $ifNull: ['$sharedPost.originalPost.taggedGroups', []] } },
                pipeline: [{ $match: { $expr: { $in: ['$_id', '$$ids'] } } }, { $project: { _id: 1, name: 1 } }],
                as: 'sharedPost_originalPost_taggedGroups',
            },
        },
        {
            $lookup: {
                from: 'companies',
                let: { ids: { $ifNull: ['$sharedPost.originalPost.taggedCompanies', []] } },
                pipeline: [{ $match: { $expr: { $in: ['$_id', '$$ids'] } } }, { $project: { _id: 1, name: 1 } }],
                as: 'sharedPost_originalPost_taggedCompanies',
            },
        },
        {
            $set: {
                'sharedPost.originalPost.taggedUsers': '$sharedPost_originalPost_taggedUsers',
                'sharedPost.originalPost.taggedGroups': '$sharedPost_originalPost_taggedGroups',
                'sharedPost.originalPost.taggedCompanies': '$sharedPost_originalPost_taggedCompanies',
            },
        },
        {
            $unset: [
                'sharedPost_originalPost_taggedUsers',
                'sharedPost_originalPost_taggedGroups',
                'sharedPost_originalPost_taggedCompanies',
            ],
        },
    ];
    return Feed.aggregate(pipeline);
};
/**
 * Updates a feed post by its ID.
 *
 * @param {string} postId - The ID of the post to update.
 * @param {Object} body - The update data for the post.
 * @param {Object} meta - Additional options for the update operation.
 * @returns {Promise<Object>} The updated post document.
 */
const findByIdAndUpdate = async (postId, body, meta) => {
    return await Feed.findByIdAndUpdate(postId, body, meta);
};

/**
 * Toggles the like status of a post for a given user.
 *
 * @param {string} postId - The ID of the post to be liked or unliked.
 * @param {string} userId - The ID of the user who is liking or unliking the post.
 * @throws {ApiError} If the post is not found.
 * @returns {Promise<void>} A promise that resolves when the like status has been toggled.
 */
const toggleLikePost = async (postId, userId, reaction = 'like') => {
    const post = await findFeedById(postId);
    if (!post) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Unable to find post.');
    }
    let isLiked = true;
    const likedIndex = post.likes.findIndex((like) => like.userId.toString() === userId);
    if (likedIndex > -1) {
        if (post.likes[likedIndex].type === reaction) {
            post.likes.splice(likedIndex, 1); // Unlike
            post.likeCount = Math.max(0, post.likeCount - 1);
            isLiked = false;
        } else {
            post.likes[likedIndex].type = reaction; // Update reaction type
        }
    } else {
        post.likes.push({ userId, type: reaction }); // Like
        post.likeCount += 1;
    }
    // if (likedIndex > -1) {
    //   post.likes.splice(likedIndex, 1); // Unlike
    //   post.likeCount = Math.max(0, post.likeCount - 1);
    // } else {
    //   post.likes.push({ userId, type: reaction }); // Like
    //   post.likeCount += 1;
    // }

    await post.save();
    return { post, isLiked };
};

const addReplyToComment = async (commentId, userId, text, tags) => {
    const { taggedUsers, taggedGroups, taggedCompanies } = tags ? await validateTags(tags) : await parseTags(text);

    return await Comment.findByIdAndUpdate(
        commentId,
        {
            $push: {
                replies: { userId, text, taggedUsers, taggedGroups, taggedCompanies },
            },
        },
        { new: true },
    );
};

const getScheduledPosts = async (userId) => {
    const scheduledPosts = await Feed.find({ userId, status: 'scheduled' }).sort({ scheduledAt: 1 });
    return scheduledPosts;
};

const votePoll = async (postId, userId, selectedOption) => {
    const post = await findFeedById(postId);
    if (!post || !post.poll) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Poll not found for this post');
    }

    if (!post.poll.options.includes(selectedOption)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid poll option selected.');
    }
    // Check if user already voted
    const existingVoteIndex = post.poll.votes.findIndex((vote) => vote.userId.toString() === userId);
    if (existingVoteIndex !== -1) {
        post.poll.votes[existingVoteIndex].selectedOption = selectedOption; // Update vote
    } else {
        post.poll.votes.push({ userId, selectedOption }); // New vote
    }

    await post.save();
    return post;
};

const getPollResults = async (postId) => {
    const post = await Feed.findById(postId);
    if (!post || !post.poll) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Poll not found for this post');
    }

    const totalVotes = post.poll.votes.length;
    const optionCounts = {};
    const optionPercentages = {};

    // Initialize counts for each option
    post.poll.options.forEach((option) => {
        optionCounts[option] = 0;
    });

    // Count votes for each option
    post.poll.votes.forEach((vote) => {
        if (optionCounts[vote.selectedOption] !== undefined) {
            optionCounts[vote.selectedOption] += 1; // Fixed ESLint issue
        }
    });

    // Calculate percentages
    Object.keys(optionCounts).forEach((option) => {
        optionPercentages[option] =
            totalVotes > 0 ? `${((optionCounts[option] / totalVotes) * 100).toFixed(2)}%` : '0%';
    });

    return {
        postId,
        totalVotes,
        results: optionCounts,
        percentages: optionPercentages,
    };
};

const count = async (filter = {}) => {
    return await Feed.countDocuments(filter);
};

const searchEngine = async (query, userId) => {
    const postResults = await Feed.find({
        status: 'published',
        $or: [{ caption: { $regex: query, $options: 'i' } }],
    });
    const userResults = await User.aggregate([
        {
            $match: {
                _id: { $ne: new mongoose.Types.ObjectId(userId) },
            },
        },
        {
            $lookup: {
                from: 'userprofiles',
                localField: '_id',
                foreignField: 'userId',
                as: 'profile',
            },
        },
        {
            $unwind: {
                path: '$profile',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $match: {
                $or: [
                    { firstName: { $regex: query, $options: 'i' } },
                    { lastName: { $regex: query, $options: 'i' } },
                    { 'profile.username': { $regex: query, $options: 'i' } },
                    { displayName: { $regex: query, $options: 'i' } },
                    { 'profile.bio': { $regex: query, $options: 'i' } },
                ],
            },
        },
        {
            $project: {
                role: 1,
                isEmailVerified: 1,
                provider: 1,
                status: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                dob: 1,
                stripe_customer_id: 1,
                createdAt: 1,
                displayName: 1,
                username: '$profile.username',
                bio: '$profile.bio',
                profilePicture: 1,
                fcmToken: 1,
                id: '$_id',
                _id: 0,
            },
        },
    ]);

    const groupResults = await Group.find({
        name: { $regex: query, $options: 'i' },
    });

    const companyPageResults = await Company.find({
        name: { $regex: query, $options: 'i' },
    });
    return { users: userResults, groups: groupResults, companies: companyPageResults, posts: postResults };
};

const getLikedProfiles = async (postId) => {
    const post = await findFeedById(postId);
    if (!post) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
    }
    const userIds = post.likes.map((like) => like.userId);
    const users = await User.find({ _id: { $in: userIds } }, 'firstName lastName displayName profilePicture')
        .populate('userProfile', 'username')
        .lean();
    users.forEach((user) => {
        if (user.userProfile) {
            user.username = user.userProfile.username;
            delete user.userProfile;
        }
    });

    // Add the type of likes (reactions) to the user objects
    users.forEach((user) => {
        // eslint-disable-next-line no-shadow
        const like = post.likes.find((like) => like.userId.toString() === user._id.toString());
        if (like) {
            // eslint-disable-next-line no-param-reassign
            user.reaction = like.type;
        }
    });

    // Count the number of each type of reaction
    const reactionCounts = post.likes.reduce((counts, like) => {
        // eslint-disable-next-line no-param-reassign
        counts[like.type] = (counts[like.type] || 0) + 1;
        return counts;
    }, {});

    return { users, reactionCounts };
};

const deleteFeed = async (postId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    await Comment.deleteMany({ postId }, { session });
    const post = await Feed.findByIdAndDelete(postId, { session });
    if (!post) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');
    }
    await session.commitTransaction();
    session.endSession();
    return { success: true };
};

const getCommentById = async (commentId) => {
    const comment = await Comment.findOne({ _id: commentId }).populate('userId').lean();
    return comment;
};
const findFeedsByIds = async (postIds) => {
    const posts = await Feed.find({ _id: { $in: postIds } });
    return posts;
};

const getMediaPostsByUser = async (userId, page = 1, limit = 10) => {
    console.log(
        `[getMediaPostsByUser] Fetching strictly image posts for userId: ${userId}, page: ${page}, limit: ${limit}`,
    );

    const validImageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    const posts = await Feed.find({
        userId,
        media: { $exists: true, $not: { $size: 0 } },
    })
        .select('_id media')
        .sort({ createdAt: -1 });

    const imagePosts = posts
        .map((post) => {
            const images = post.media.filter(
                (item) =>
                    item.type === 'image' &&
                    item.url &&
                    validImageExtensions.some((ext) => item.url.toLowerCase().endsWith(ext)),
            );
            return images.length > 0 ? { _id: post._id, media: images } : null;
        })
        .filter(Boolean); // remove nulls

    // Calculate pagination
    const totalPosts = imagePosts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const skip = (currentPage - 1) * limit;

    // Apply pagination
    const paginatedPosts = imagePosts.slice(skip, skip + limit);

    console.log(
        `[getMediaPostsByUser] Found ${totalPosts} valid image posts, returning page ${currentPage} of ${totalPages}`,
    );

    return {
        posts: paginatedPosts,
        pagination: {
            currentPage,
            totalPages,
            totalPosts,
            limit,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
        },
    };
};

const getVideoPostsByUser = async (userId, page = 1, limit = 10) => {
    console.log(`[getVideoPostsByUser] Fetching video posts for userId: ${userId}, page: ${page}, limit: ${limit}`);

    const validVideoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.gif'];

    const posts = await Feed.find({
        userId,
        media: { $exists: true, $not: { $size: 0 } },
    })
        .select('_id media')
        .sort({ createdAt: -1 });

    const videoPosts = posts
        .map((post) => {
            const videos = post.media.filter(
                (item) =>
                    (item.type === 'video' || item.type === 'gif') &&
                    item.url &&
                    validVideoExtensions.some((ext) => item.url.toLowerCase().endsWith(ext)),
            );
            return videos.length > 0 ? { _id: post._id, media: videos } : null;
        })
        .filter(Boolean); // remove nulls

    // Calculate pagination
    const totalPosts = videoPosts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const skip = (currentPage - 1) * limit;

    // Apply pagination
    const paginatedPosts = videoPosts.slice(skip, skip + limit);

    console.log(
        `[getVideoPostsByUser] Found ${totalPosts} valid video posts, returning page ${currentPage} of ${totalPages}`,
    );

    return {
        posts: paginatedPosts,
        pagination: {
            currentPage,
            totalPages,
            totalPosts,
            limit,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
        },
    };
};

const getVideoPostsByGroup = async (groupId, page = 1, limit = 10) => {
    console.log(`[getVideoPostsByGroup] Fetching video posts for groupId: ${groupId}, page: ${page}, limit: ${limit}`);

    const validVideoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.gif'];

    const posts = await Feed.find({
        groupId,
        media: { $exists: true, $not: { $size: 0 } },
    });

    const videoPosts = posts
        .map((post) => {
            const videos = post.media.filter(
                (item) =>
                    (item.type === 'video' || item.type === 'gif') &&
                    item.url &&
                    validVideoExtensions.some((ext) => item.url.toLowerCase().endsWith(ext)),
            );
            return videos.length > 0 ? { _id: post._id, media: videos } : null;
        })
        .filter(Boolean); // remove nulls

    // Calculate pagination
    const totalPosts = videoPosts.length;
    const totalPages = Math.ceil(totalPosts / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const skip = (currentPage - 1) * limit;

    // Apply pagination
    const paginatedPosts = videoPosts.slice(skip, skip + limit);
    return {
        posts: paginatedPosts,
        pagination: {
            currentPage,
            totalPages,
            totalPosts: videoPosts.length,
            limit,
            hasNextPage: currentPage < totalPages,
            hasPreviousPage: currentPage > 1,
        },
    };
};

const getMediaPostsByCompany = async (companyId) => {
    console.log(`[getMediaPostsByCompany] Fetching strictly image posts for companyId: ${companyId}`);

    const validImageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    const posts = await Feed.find({
        companyId,
        media: { $exists: true, $not: { $size: 0 } },
    })
        .select('_id media')
        .sort({ createdAt: -1 });

    const imagePosts = posts
        .map((post) => {
            const images = post.media.filter(
                (item) =>
                    item.type === 'image' &&
                    item.url &&
                    validImageExtensions.some((ext) => item.url.toLowerCase().endsWith(ext)),
            );
            return images.length > 0 ? { _id: post._id, media: images } : null;
        })
        .filter(Boolean); // remove nulls

    console.log(`[getMediaPostsByCompany] Found ${imagePosts.length} valid image posts`);
    return imagePosts;
};

module.exports = {
    searchEngine,
    getLikedProfiles,
    createFeed,
    updateFeed,
    deleteFeed,
    findFeedById,
    findFeed,
    findByIdAndUpdate,
    toggleLikePost,
    addReplyToComment,
    getFeeds,
    getScheduledPosts,
    getComments,
    votePoll,
    getPollResults,
    count,
    getCommentById,
    findFeedsByIds,
    getMediaPostsByUser,
    getVideoPostsByUser,
    getVideoPostsByGroup,
    getMediaPostsByCompany,
    // fns
    parseTags,
    validateTags,
};
