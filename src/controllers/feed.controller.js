const httpStatus = require('http-status');
const {
    feedService,
    commentService,
    userconnectionService,
    notificationService,
    reportService,
    userService,
} = require('../services');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { agenda } = require('../jobs/agenda');
const { generateNotificationBody, actions } = require('../config/notificationActions');
const pick = require('../utils/pick');
const { Comment } = require('../models');
const geoip = require('geoip-lite');

// const getFeeds = catchAsync(async (req, res) => {
//   const { userId, postType, groupId, companyId, search, limit = 10, cursor } = req.query;
//   const { posts, nextCursor } = await feedService.getFeeds(
//     userId,
//     postType,
//     search,
//     limit,
//     cursor,
//     groupId,
//     companyId,
//     req.user.role,
//     req.user.id,
//   );
//   return res.status(httpStatus.OK).send({ posts, nextCursor });
// });

const getFeeds = catchAsync(async (req, res) => {
    const { userId, postType, groupId, companyId, search, limit = 10, cursor, page, timezone = 'UTC' } = req.query;
    const { posts, nextCursor, postsCount } = await feedService.getFeeds(
        userId,
        postType,
        search,
        limit,
        cursor,
        groupId,
        companyId,
        req.user.role,
        req.user.id,
        timezone, // pass timezone to service
        page, // pass page to service
    );
    return res.status(httpStatus.OK).send({ posts, nextCursor, postsCount });
});

const getFeed = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const posts = await feedService.findFeed(postId);
    return res.status(httpStatus.OK).send({ posts });
});

const deleteFeed = catchAsync(async (req, res) => {
    const { postId } = req.params;
    await feedService.deleteFeed(postId);
    return res.status(httpStatus.NO_CONTENT).send();
});

const createPost = catchAsync(async (req, res) => {
    const { scheduledAt, caption, tags, createdAt } = req.body;

    let processedBody = { ...req.body };

    const parseDateExact = (dateValue) => {
        if (!dateValue) return null;

        if (typeof dateValue === 'string') {
            const hasTimezone = dateValue.includes('Z') || dateValue.match(/[+-]\d{2}:\d{2}$/);

            if (!hasTimezone) {
                const dateStr = dateValue.replace(/\.\d{3}/, '');
                const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);

                if (parts) {
                    const year = parseInt(parts[1], 10);
                    const month = parseInt(parts[2], 10) - 1;
                    const day = parseInt(parts[3], 10);
                    const hour = parseInt(parts[4], 10);
                    const minute = parseInt(parts[5], 10);
                    const second = parseInt(parts[6], 10);

                    return new Date(Date.UTC(year, month, day, hour, minute, second));
                }

                return new Date(dateValue + 'Z');
            }

            return new Date(dateValue);
        }

        return new Date(dateValue);
    };

    if (scheduledAt) {
        const scheduledDate = parseDateExact(scheduledAt);
        if (!scheduledDate || isNaN(scheduledDate.getTime())) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid scheduledAt date format');
        }
        processedBody.scheduledAt = scheduledDate;
    }

    if (createdAt) {
        const createdDate = parseDateExact(createdAt);
        if (!createdDate || isNaN(createdDate.getTime())) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid createdAt date format');
        }
        processedBody.createdAt = createdDate;
    }

    const response = await feedService.createFeed(req.user.id, processedBody);
    const followers = await userconnectionService.getFriends(req.user.id);
    if (followers.length) {
        const modifiedFollowers = followers
            .map((itm) => {
                // Determine which user is the friend (not the current user)
                const friend = itm.sender._id.toString() === req.user.id.toString() ? itm.receiver : itm.sender;
                return {
                    userId: friend._id,
                    fcmToken: friend.fcmToken ? friend.fcmToken : '',
                };
            })
            .filter((follower) => follower.userId.toString() !== req.user.id.toString() && follower.fcmToken);
        if (modifiedFollowers.length > 0) {
            const userWithProfile = await userService.getUserById(req.user.id);
            const userName =
                userWithProfile?.username || req.user.displayName || `${req.user.firstName} ${req.user.lastName}`;
            await notificationService.scheduleNotifications(
                modifiedFollowers,
                `${userName} posted`,
                generateNotificationBody(actions.POST_ADD, { post: req.body.caption }),
                { feedId: response._id.toString() },
                actions.POST_ADD,
                null,
                null,
                500,
            );
        }
    }
    res.status(httpStatus.OK).send({
        post: response,
    });
    if (scheduledAt) {
        await agenda.schedule(new Date(scheduledAt), 'publish post', { postId: response.id });
    }

    if (tags && tags.length) {
        const userWithProfile = await userService.getUserById(req.user.id);
        const userName =
            userWithProfile?.username || req.user.displayName || `${req.user.firstName} ${req.user.lastName}`;
        const fcmTokens = tags.map((itm) => ({ token: itm.fcmToken, userId: itm.id }));
        await Promise.all(
            fcmTokens.map(({ token, userId }) =>
                notificationService.sendNotificationToUser(
                    token,
                    `${userName} mentioned you in a post`,
                    `${userName} mentioned you in a post: ${caption}`,
                    { userId, companyId: response?.companyId || null, groupId: response?.groupId || null },
                    { feedId: response?._id.toString(), icon: req.user.profilePicture },
                    true,
                    actions.POST_MENTION,
                ),
            ),
        );
    }
});

const updatePost = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const response = await feedService.updateFeed(postId, req.body);
    res.status(httpStatus.OK).send({
        post: response,
    });
});

const getLikedProfiles = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const { users, reactionCounts } = await feedService.getLikedProfiles(postId);
    res.status(httpStatus.OK).send({ users, reactionCounts });
});

const getTextOfReaction = (reaction) => {
    switch (reaction) {
        case 'like':
            return 'liked';
        case 'dislike':
            return 'disliked';
        case 'happy':
            return 'laughed';
        case 'celebrate':
            return 'celebrated';
        case 'sad':
            return 'felt sad';
        case 'angry':
            return 'felt angry';
        default:
            return 'liked';
    }
};

const likePost = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const { reaction } = req.query;
    const userId = req.user.id;
    const displayName = req.user.displayName;
    /* eslint-disable no-unused-vars */
    const { post, isLiked } = await feedService.toggleLikePost(postId, userId, reaction);

    res.status(httpStatus.OK).send({
        post,
    });

    if (isLiked) {
        console.log('displayName', displayName);
        try {
            /* eslint-disable no-shadow */
            const post = await feedService.findFeed(postId);
            if (post && post.length > 0) {
                const user = post[0]?.userId;
                if (user && user.fcmToken && post[0]?.userId._id.toString() !== userId) {
                    const userWithProfile = await userService.getUserById(req.user.id);
                    const userName =
                        userWithProfile?.username || displayName || `${req.user.firstName} ${req.user.lastName}`;
                    await notificationService.sendNotificationToUser(
                        user.fcmToken,
                        `${userName} ${getTextOfReaction(reaction)} on your post`,
                        generateNotificationBody(actions.POST_LIKE, {
                            post: `Tap here to view`,
                        }),
                        { userId: user._id, companyId: post[0]?.companyId || null, groupId: post[0]?.groupId || null },
                        { feedId: postId, icon: req.user.profilePicture },
                        true,
                        actions.POST_LIKE,
                    );
                }
            }
        } catch (error) {
            // bypass no-empty lint
        }
    }
});

const commentOnPost = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const { text, tags } = req.body;
    const newComment = await commentService.createComment(postId, req.user.id, text, tags);

    res.status(httpStatus.OK).send({
        comment: newComment,
    });

    try {
        const post = await feedService.findFeed(postId);
        if (post && post.length > 0) {
            const user = post[0]?.userId;
            if (user && user.fcmToken && post[0]?.userId._id.toString() !== req.user.id) {
                const userWithProfile = await userService.getUserById(req.user.id);
                const userName =
                    userWithProfile?.username || req.user.displayName || `${req.user.firstName} ${req.user.lastName}`;
                await notificationService.sendNotificationToUser(
                    user.fcmToken,
                    `${userName} commented on your post`,
                    generateNotificationBody(actions.POST_COMMENT, { post: 'Tap here to view' }),
                    { userId: user._id, companyId: null, groupId: null },
                    { feedId: postId, icon: req.user.profilePicture },
                    true,
                    actions.POST_COMMENT,
                );
            }
        }
    } catch (error) {
        // bypass no-empty lint
    }
});

const toggleLikeComment = catchAsync(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id;

    const { updatedComment, alreadyLiked } = await commentService.toggleLikeComment(commentId, userId);

    return res.status(httpStatus.OK).send({
        message: alreadyLiked ? 'Comment unliked' : 'Comment liked',
        likeCount: updatedComment.likeCount,
    });
});

const deleteComment = catchAsync(async (req, res) => {
    const { commentId } = req.params;
    await commentService.deleteComment(commentId, req.user);
    return res.status(httpStatus.OK).send({ message: 'Comment deleted' });
});

const sharePost = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const { caption, tags } = req.body;
    const originalPost = await feedService.findFeedById(postId);
    if (!originalPost) throw new ApiError(httpStatus.NOT_FOUND, 'Post not found');

    const sharedPostBody = {
        postType: 'sharedPost',
        caption,
        sharedPost: {
            originalPost: originalPost._id,
            caption,
            tags: tags || [],
        },
    };
    const sharedPost = await feedService.createFeed(req.user.id, sharedPostBody);
    originalPost.shares.push(req.user.id);
    originalPost.shareCount = (originalPost.shareCount || 0) + 1;
    await originalPost.save();
    res.status(httpStatus.CREATED).send({ post: sharedPost });

    try {
        if (sharedPost) {
            const user = originalPost?.userId;
            if (user && user.fcmToken && user._id.toString() !== req.user.id) {
                const userWithProfile = await userService.getUserById(req.user.id);
                const userName =
                    userWithProfile?.username || req.user.displayName || `${req.user.firstName} ${req.user.lastName}`;
                await notificationService.sendNotificationToUser(
                    user.fcmToken,
                    `${userName} shared your post`,
                    generateNotificationBody(actions.POST_SHARE, { post: '' }),
                    { userId: user._id, companyId: null, groupId: null },
                    { feedId: postId, icon: req.user.profilePicture },
                    true,
                    actions.POST_SHARE,
                );
            }
        }
    } catch (error) {
        // bypass no-empty lint
    }
});

// OLD
// const replyToComment = catchAsync(async (req, res) => {
//   const { commentId } = req.params;
//   const { text, tags = [] } = req.body;

//   const updatedPost = await feedService.addReplyToComment(commentId, req.user.id, text, tags);
//   res.status(httpStatus.OK).send({ comments: updatedPost });

//   try {
//     const post = await feedService.findFeed(updatedPost.postId);
//     const postOwner = post[0]?.userId; // Post creator
//     const commentAuthor = req.user; // The user replying to the comment
//     const originalComment = await feedService.getCommentById(commentId);
//     const originalCommentAuthor = originalComment?.userId;

//     const notificationBody = generateNotificationBody(actions.POST_COMMENT, { post: 'Tap here to view' });

//     // 1️⃣ **If you replied to someone's comment on your post** → Notify the original commenter
//     if (postOwner._id.toString() === commentAuthor.id && originalCommentAuthor._id.toString() !== commentAuthor.id) {
//       if (originalCommentAuthor.fcmToken) {
//         await notificationService.sendNotificationToUser(
//           originalCommentAuthor.fcmToken,
//           `${commentAuthor.firstName} ${commentAuthor.lastName} replied to your comment.`,
//           notificationBody,
//           { userId: originalCommentAuthor._id.toString(), companyId: null, groupId: null },
//           { feedId: post[0]._id.toString(), icon: commentAuthor?.profilePicture },
//           true,
//           actions.POST_COMMENT
//         );
//       }
//     }
//     // 2️⃣ **If someone replied to your comment on your post** → Notify the post owner
//     else if (originalCommentAuthor._id.toString() === commentAuthor.id && postOwner._id.toString() !== commentAuthor.id) {
//       if (postOwner.fcmToken) {
//         await notificationService.sendNotificationToUser(
//           postOwner.fcmToken,
//           `${commentAuthor.firstName} ${commentAuthor.lastName} replied to a comment on your post.`,
//           notificationBody,
//           { userId: postOwner._id.toString(), companyId: null, groupId: null },
//           { feedId: post[0]._id.toString(), icon: commentAuthor?.profilePicture },
//           true,
//           actions.POST_COMMENT
//         );
//       }
//     } else if (postOwner._id.toString() !== commentAuthor.id && originalCommentAuthor._id.toString() !== commentAuthor.id) {
//       // Notify original commenter
//       if (originalCommentAuthor.fcmToken) {
//         await notificationService.sendNotificationToUser(
//           originalCommentAuthor.fcmToken,
//           `${commentAuthor.firstName} ${commentAuthor.lastName} replied to your comment.`,
//           notificationBody,
//           { userId: originalCommentAuthor._id.toString(), companyId: null, groupId: null },
//           { feedId: post[0]._id.toString(), icon: commentAuthor?.profilePicture },
//           true,
//           actions.POST_COMMENT
//         );
//       }
//       if (postOwner.fcmToken && postOwner._id.toString() !== originalCommentAuthor._id.toString()) {
//         await notificationService.sendNotificationToUser(
//           postOwner.fcmToken,
//           `${commentAuthor.firstName} ${commentAuthor.lastName} replied to a comment on your post.`,
//           notificationBody,
//           { userId: postOwner._id.toString(), companyId: null, groupId: null },
//           { feedId: post[0]._id.toString(), icon: commentAuthor?.profilePicture },
//           true,
//           actions.POST_COMMENT
//         );
//       }
//     }
//   } catch (error) {
//     // bypass no-empty lint
//     // console.log(error);
//   }
// });

const replyToComment = catchAsync(async (req, res) => {
    const { commentId, postId } = req.params;
    const { text, tags = [] } = req.body;

    // Create a new comment with parentId set to commentId
    const newReply = await commentService.createComment(postId, req.user.id, text, tags, commentId);

    // Set postId for the reply based on the parent comment
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
        throw new Error('Parent comment not found');
    }
    newReply.postId = parentComment.postId;
    await newReply.save();

    res.status(httpStatus.OK).send({ comment: newReply });

    try {
        const post = await feedService.findFeed(parentComment.postId);
        const postOwner = post[0]?.userId; // Post creator
        const commentAuthor = req.user; // The user replying to the comment
        const originalCommentAuthor = parentComment?.userId;

        const notificationBody = generateNotificationBody(actions.POST_COMMENT, { post: 'Tap here to view' });

        // 1️⃣ If you replied to someone's comment on your post → Notify the original commenter
        if (
            postOwner._id.toString() === commentAuthor.id &&
            originalCommentAuthor._id.toString() !== commentAuthor.id
        ) {
            if (originalCommentAuthor.fcmToken) {
                await notificationService.sendNotificationToUser(
                    originalCommentAuthor.fcmToken,
                    `${commentAuthor.firstName} ${commentAuthor.lastName} replied to your comment.`,
                    notificationBody,
                    { userId: originalCommentAuthor._id.toString(), companyId: null, groupId: null },
                    { feedId: post[0]._id.toString(), icon: commentAuthor?.profilePicture },
                    true,
                    actions.POST_COMMENT,
                );
            }
        }
        // 2️⃣ If someone replied to your comment on your post → Notify the post owner
        else if (
            originalCommentAuthor._id.toString() === commentAuthor.id &&
            postOwner._id.toString() !== commentAuthor.id
        ) {
            if (postOwner.fcmToken) {
                await notificationService.sendNotificationToUser(
                    postOwner.fcmToken,
                    `${commentAuthor.firstName} ${commentAuthor.lastName} replied to a comment on your post.`,
                    notificationBody,
                    { userId: postOwner._id.toString(), companyId: null, groupId: null },
                    { feedId: post[0]._id.toString(), icon: commentAuthor?.profilePicture },
                    true,
                    actions.POST_COMMENT,
                );
            }
        } else if (
            postOwner._id.toString() !== commentAuthor.id &&
            originalCommentAuthor._id.toString() !== commentAuthor.id
        ) {
            // Notify original commenter
            if (originalCommentAuthor.fcmToken) {
                await notificationService.sendNotificationToUser(
                    originalCommentAuthor.fcmToken,
                    `${commentAuthor.firstName} ${commentAuthor.lastName} replied to your comment.`,
                    notificationBody,
                    { userId: originalCommentAuthor._id.toString(), companyId: null, groupId: null },
                    { feedId: post[0]._id.toString(), icon: commentAuthor?.profilePicture },
                    true,
                    actions.POST_COMMENT,
                );
            }
            if (postOwner.fcmToken && postOwner._id.toString() !== originalCommentAuthor._id.toString()) {
                await notificationService.sendNotificationToUser(
                    postOwner.fcmToken,
                    `${commentAuthor.firstName} ${commentAuthor.lastName} replied to a comment on your post.`,
                    notificationBody,
                    { userId: postOwner._id.toString(), companyId: null, groupId: null },
                    { feedId: post[0]._id.toString(), icon: commentAuthor?.profilePicture },
                    true,
                    actions.POST_COMMENT,
                );
            }
        }
    } catch (error) {
        // bypass no-empty lint
    }
});

const getReplies = catchAsync(async (req, res) => {
    const replies = await commentService.getReplies(req.params.commentId);
    res.status(httpStatus.OK).send({ comments: replies });
});

const getScheduledPosts = catchAsync(async (req, res) => {
    const posts = await feedService.getScheduledPosts(req.user.id);
    res.status(httpStatus.OK).send({
        posts,
    });
});

const getCommentsOnPost = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const posts = await feedService.getComments(postId);
    res.status(httpStatus.OK).send({
        posts,
    });
});

const votePoll = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const { selectedOption } = req.body;
    const userId = req.user.id;

    const updatedPost = await feedService.votePoll(postId, userId, selectedOption);
    const results = await feedService.getPollResults(postId);
    res.status(httpStatus.OK).send({ post: updatedPost, results });
});

const getPollResults = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const results = await feedService.getPollResults(postId);
    res.status(httpStatus.OK).send({ results });
});

const searchEngine = catchAsync(async (req, res) => {
    const { query } = req.query;
    const { posts, users, groups, companies } = await feedService.searchEngine(query, req.user.id);
    res.status(httpStatus.OK).send({ posts, users, groups, companies });
});

const reportComment = catchAsync(async (req, res) => {});

const reportPost = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const { content, reportType } = req.body;
    const post = await feedService.findFeed(postId);
    await reportService.reportPost({
        reportedBy: req.user.id,
        reportedTo: post.userId,
        type: 'post',
        content,
        reportType,
        postId,
    });
    return res.status(httpStatus.OK).send({ message: 'Post reported' });
});

const suspendPost = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const post = await feedService.findFeedById(postId);
    if (post.status === 'suspended') {
        await feedService.findByIdAndUpdate(postId, { status: 'published' });
    } else {
        await feedService.findByIdAndUpdate(postId, { status: 'suspended' });
    }
    return res.status(httpStatus.OK).send({ status: post.status });
});

const getReportedPosts = catchAsync(async (req, res) => {
    const filter = pick(req.query, ['reportedBy', 'reportedTo']);
    const options = pick(req.query, ['sortBy', 'limit', 'page']);
    options.populate = 'reportedBy,reportedTo,postId';
    const reports = await reportService.queryReports(filter, options);
    res.status(httpStatus.OK).send({ ...reports });
});

const getReport = catchAsync(async (req, res) => {
    const { reportId } = req.params;
    const report = await reportService.getReportById(reportId);
    if (!report) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Report not found');
    }
    const post = await feedService.findFeed(report.postId);
    const reporters = await reportService.getReports({
        type: 'post',
        postId: report.postId,
        populate: ['reportedBy'],
    });
    const allreporters = reporters.map((report) => ({
        ...report.reportedBy,
        reason: report.content,
        reportedAt: report.createdAt,
        reportType: report.reportType,
    }));
    report.postId = post ? post[0] : report.postId;
    res.status(httpStatus.OK).send({ report, allreporters });
});

const getPostReporters = catchAsync(async (req, res) => {
    const { postId } = req.params;
    const reports = await reportService.getReports({
        type: 'post',
        postId,
        populate: ['reportedBy', 'reportedTo'],
    });
    if (!reports.length) {
        return res.status(httpStatus.OK).send({ users: [] });
    }
    const users = reports.map((report) => ({
        ...report.reportedBy,
        reason: report.content,
        reportType: report.reportType,
    }));
    return res.status(httpStatus.OK).send({ users });
});

const getMediaPostsByUser = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // You may adjust filter if your schema stores media under specific fields (e.g., postType: 'media' or files.length > 0)
    const result = await feedService.getMediaPostsByUser(userId, page, limit);

    const formattedPosts = result.posts.map((post) => ({
        _id: post._id,
        media: post.media || post.files || [], // change based on your schema
    }));

    return res.status(httpStatus.OK).send({
        posts: formattedPosts,
        pagination: result.pagination,
    });
});

const getVideoPostsByUser = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await feedService.getVideoPostsByUser(userId, page, limit);

    const formattedPosts = result.posts.map((post) => ({
        _id: post._id,
        media: post.media || post.files || [],
    }));

    return res.status(httpStatus.OK).send({
        posts: formattedPosts,
        pagination: result.pagination,
    });
});

const getVideoPostsByGroup = catchAsync(async (req, res) => {
    const { groupId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const result = await feedService.getVideoPostsByGroup(groupId, page, limit);

    const formattedPosts = result.posts.map((post) => ({
        _id: post._id,
        media: post.media || post.files || [],
    }));

    return res.status(httpStatus.OK).send({
        posts: formattedPosts,
        pagination: result.pagination,
    });
});

const getMediaPostsByCompany = catchAsync(async (req, res) => {
    const { companyId } = req.params;

    const mediaPosts = await feedService.getMediaPostsByCompany(companyId);

    const result = mediaPosts.map((post) => ({
        _id: post._id,
        media: post.media || post.files || [],
    }));

    return res.status(httpStatus.OK).send({ posts: result });
});

module.exports = {
    createPost,
    updatePost,
    replyToComment,
    likePost,
    commentOnPost,
    toggleLikeComment,
    deleteComment,
    sharePost,
    getFeeds,
    getScheduledPosts,
    getCommentsOnPost,
    votePoll,
    getPollResults,
    searchEngine,
    getFeed,
    getLikedProfiles,
    deleteFeed,
    reportComment,
    reportPost,
    getReportedPosts,
    getPostReporters,
    suspendPost,
    getReport,
    getMediaPostsByUser,
    getVideoPostsByUser,
    getVideoPostsByGroup,
    getMediaPostsByCompany,
    getReplies,
};
