const db = require('../models')
const User = db.User
const helpers = require('../_helpers')
const Tweet = db.Tweet
const Like = db.Like
const Reply = db.Reply

const tweetController = {
  getTweet: async (req, res) => {
    //tweet data
    let tweets = await Tweet.findAll({
      order: [['createdAt', 'DESC']],
      include: [User, Like, Reply]
    })
    tweets = tweets.map(t => ({
      ...t.dataValues,
      userName: t.User.name,
      userId: t.User.id,
      userAvatar: t.User.avatar,
      userAccount: t.User.account,
      LikedCount: t.Likes.length,
      ReplyCount: t.Replies.length,
      isLiked: helpers.getUser(req).Likes ? helpers.getUser(req).Likes.map(d => d.TweetId).includes(t.id) : false
    }))

    //user data
    let users = await helpers.getTopUser(req)

    return res.render('tweets', { users, tweets })
  },

  postTweet: async (req, res) => {
    const { description } = req.body
    if (!description.trim()) {
      req.flash('error_messages', '請輸入些甚麼')
      return res.redirect('/tweets')
    }
    if (description.length > 140) {
      req.flash('error_messages', '超過140字。')
      return res.redirect('/tweets')
    }
    await Tweet.create({
      UserId: helpers.getUser(req).id,
      description: req.body.description
    })
    return res.redirect('/tweets')
  },

  getReply: async (req, res) => {
    let tweet = await Tweet.findByPk(req.params.id, {
      order: [[{ model: Reply }, 'createdAt', 'DESC']],
      include: [
        User,
        Like,
        { model: Reply, include: [User] },
      ]
    })

    tweet = tweet.toJSON()
    const isLiked = tweet.Likes ? tweet.Likes.some(d => d.UserId === helpers.getUser(req).id) : false

    //////////////////////////////user data
    let users = await helpers.getTopUser(req)
    /////////////////////////////////////////////////     

    return res.render('reply', {
      tweet,
      ReplyCount: tweet.Replies.length,
      LikedCount: tweet.Likes.length,
      isLiked,
      users
    })
  },

  postReply: async (req, res) => {
    const tweetId = Number(req.params.id)
    const { comment } = req.body

    if (!comment.trim()) {
      req.flash('error_messages', '請輸入些甚麼')
      return res.redirect('back')
    }
    if (comment.length > 140) {
      req.flash('error_messages', '超過140字。')
      return res.redirect('back')
    }
    await Reply.create({
      UserId: helpers.getUser(req).id,
      TweetId: tweetId,
      comment
    })
    return res.redirect('back')
  },

  addLike: async (req, res) => {
    await Like.create({
      UserId: helpers.getUser(req).id,
      TweetId: req.params.id
    })
    return res.redirect('back')
  },
  removeLike: async (req, res) => {
    const awaitRemove = await Like.findOne({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId: req.params.id
      }
    })
    await awaitRemove.destroy()
    return res.redirect('back')
  }
}
module.exports = tweetController