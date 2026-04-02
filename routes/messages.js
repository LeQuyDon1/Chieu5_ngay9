let express = require("express")
let router = express.Router()

let Message = require("../schemas/messages")
const { checkLogin } = require("../utils/authHandler")


router.get("/:userId", checkLogin, async function (req, res) {

    try {

        let currentUser = req.user.id
        let otherUser = req.params.userId

        let messages = await Message.find({
            $or: [
                { from: currentUser, to: otherUser },
                { from: otherUser, to: currentUser }
            ]
        }).sort({ createdAt: 1 })

        res.json(messages)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }

})


router.post("/", checkLogin, async function (req, res) {

    try {

        let { to, type, text } = req.body

        if (!to || !type || !text) {
            return res.status(400).json({
                message: "Missing fields"
            })
        }

        if (!["text", "file"].includes(type)) {
            return res.status(400).json({
                message: "Type must be text or file"
            })
        }

        let newMessage = new Message({
            from: req.user.id,
            to: to,
            messageContent: {
                type: type,
                text: text
            }
        })

        await newMessage.save()

        res.json({
            message: "Send success",
            data: newMessage
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }

})


router.get("/", checkLogin, async function (req, res) {

    try {

        let currentUser = req.user._id

        let messages = await Message.aggregate([

            {
                $match: {
                    $or: [
                        { from: currentUser },
                        { to: currentUser }
                    ]
                }
            },

            {
                $sort: { createdAt: -1 }
            },

            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$from", currentUser] },
                            "$to",
                            "$from"
                        ]
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            }

        ])

        res.json(messages)

    } catch (error) {
        res.status(500).json({ message: error.message })
    }

})
module.exports = router