const httpStatus = require('http-status');
const { Comment, Feed } = require('../models');
const ApiError = require('../utils/ApiError');
const { validateTags, parseTags } = require('./feed.service');

/**
 * Creates a new comment for a given post and increments the comment count of the post.
 *
 * @param {string} postId - The ID of the post to which the comment is being added.
 * @param {string} userId - The ID of the user creating the comment.
 * @param {string} text - The text content of the comment.
 * @param {string[]} tags - The tags associated with the comment.
 * @param {string} parentId - The parent ID of the comment (for nested comments).
 * @returns {Promise<Object>} - A promise that resolves to the newly created comment object.
 */

const createComment = async (postId, userId, text, tags = [], parentId = null) => {
    const { taggedUsers, taggedGroups, taggedCompanies } = tags ? await validateTags(tags) : await parseTags(text);

    // Create a new comment with parentId
    const newComment = await Comment.create({
        postId,
        userId,
        text,
        taggedUsers,
        taggedGroups,
        taggedCompanies,
        parentId,
    });
    if (parentId) {
        await Comment.findByIdAndUpdate(parentId, { $inc: { replyCount: 1 } });
    }

    // Increment comment count in the post
    await Feed.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    return newComment;
};

/**
 * Toggles the like status of a comment for a given user.
 *
 * @async
 * @function toggleLikeComment
 * @param {string} commentId - The ID of the comment to be liked or unliked.
 * @param {string} userId - The ID of the user who is liking or unliking the comment.
 * @returns {Promise<Object>} An object containing the updated comment and a boolean indicating if the comment was already liked by the user.
 * @throws {Error} If the comment is not found.
 */
const toggleLikeComment = async (commentId, userId) => {
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Comment not found');
    }

    // Check if user has already liked the comment
    const alreadyLiked = comment.likes.includes(userId);

    // Toggle like/unlike
    const updateQuery = alreadyLiked
        ? { $pull: { likes: userId }, $inc: { likeCount: -1 } } // Unlike
        : { $push: { likes: userId }, $inc: { likeCount: 1 } }; // Like

    const updatedComment = await Comment.findByIdAndUpdate(commentId, updateQuery, { new: true });

    return { updatedComment, alreadyLiked };
};

// OLD
// const deleteComment = async (commentId, user) => {
//   const comment = await Comment.findById(commentId);
//   if (!comment) {
//     throw new ApiError(httpStatus.NOT_FOUND, 'Comment not found');
//   }

//   // Check if the user is either the comment owner or an admin
//   if (comment.userId.toString() !== user.id && user.role !== 'admin') {
//     throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this comment');
//   }
//   await Comment.findByIdAndDelete(commentId);

//   // ✅ Decrease commentCount in the Feed
//   await Feed.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });

//   return { message: 'Comment deleted' };
// };
const deleteCommentsRecursively = async (parentCommentId) => {
    const childComments = await Comment.find({ parentId: parentCommentId }).lean();
    let totalDeleted = 0;

    for (const child of childComments) {
        const deletedCount = await deleteCommentsRecursively(child._id);
        totalDeleted += deletedCount;
        await Comment.findByIdAndDelete(child._id);
        totalDeleted += 1;
    }

    return totalDeleted;
};
const deleteComment = async (commentId, user) => {
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Comment not found');
    }

    if (comment.userId.toString() !== user.id && user.role !== 'admin') {
        throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this comment');
    }

    const totalDeleted = (await deleteCommentsRecursively(commentId)) + 1;
    if (comment.parentId) {
        await Comment.findByIdAndUpdate(comment.parentId, { $inc: { replyCount: -1 } });
    }
    await Comment.findByIdAndDelete(commentId);

    await Feed.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -totalDeleted } });

    return { message: `Comment and ${totalDeleted - 1} child comment(s) deleted` };
};

const getReplies = async (commentId) => {
    const replies = await Comment.find({ parentId: commentId })
        .populate('userId', 'firstName lastName displayName profilePicture fcmToken')
        .populate('userId.userProfile', 'username')
        .populate('taggedUsers', 'firstName lastName displayName profilePicture fcmToken')
        .populate('taggedUsers.userProfile', 'username')
        .populate('taggedCompanies', 'name profilePicture')
        .populate('taggedGroups', 'name profilePicture')
        .lean();

    replies.forEach((reply) => {
        if (reply.userId && reply.userId.userProfile) {
            reply.userId.username = reply.userId.userProfile.username;
            delete reply.userId.userProfile;
        }
        if (reply.taggedUsers) {
            reply.taggedUsers.forEach((user) => {
                if (user.userProfile) {
                    user.username = user.userProfile.username;
                    delete user.userProfile;
                }
            });
        }
    });

    return replies;
};
module.exports = {
    createComment,
    toggleLikeComment,
    deleteComment,
    getReplies,
};
