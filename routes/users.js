var express = require("express");
var router = express.Router();
let { validatedResult, CreateUserValidator, ModifyUserValidator } = require("../utils/validator")
let userModel = require("../schemas/users");
let userController = require("../controllers/users");
const { checkLogin,checkRole } = require("../utils/authHandler");
const XLSX = require('xlsx');
const path = require('path');
const mailHandler = require('../utils/mailHandler');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
router.get("/", checkLogin,checkRole("ADMIN","MODERATOR"), async function (req, res, next) {
  let users = await userModel
    .find({ isDeleted: false })
  res.send(users);
});

router.get("/:id", async function (req, res, next) {
  try {
    let result = await userModel
      .find({ _id: req.params.id, isDeleted: false })
    if (result.length > 0) {
      res.send(result);
    }
    else {
      res.status(404).send({ message: "id not found" });
    }
  } catch (error) {
    res.status(404).send({ message: "id not found" });
  }
});

router.post("/", CreateUserValidator, validatedResult, async function (req, res, next) {
  try {
    let newUser = await userController.CreateAnUser(
      req.body.username, req.body.password, req.body.email,
      req.body.role, req.body.fullname, req.body.avatarUrl
    )
    res.send(newUser);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.put("/:id", ModifyUserValidator, validatedResult, async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedItem) return res.status(404).send({ message: "id not found" });

    let populated = await userModel
      .findById(updatedItem._id)
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

router.delete("/:id", async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }
    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});
function generatePassword(length = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

router.post("/import", checkLogin, upload.single('file'), async function (req, res) {
    try {
        const filePath = req.file.path;

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        console.log(data); // 🔥 debug

        let results = [];

        for (let item of data) {
            let username = item.username;
            let email = item.email;

            if (!username || !email) {
                results.push({ email, status: "Thiếu dữ liệu" });
                continue;
            }

            let password = generatePassword(16);

            await userController.CreateAnUser(
                username,
                password,
                email,
                "USER",
                "",
                ""
            );

            await mailHandler.sendMail(email, password);

            results.push({ email, status: "OK" });
        }

        res.send({ message: "Import thành công", results });

    } catch (err) {
        console.log("ERROR IMPORT:", err); // 🔥 in chi tiết
        res.status(500).send({
            message: err.message,
            error: err
        });
    }
});
module.exports = router;