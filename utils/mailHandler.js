const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525, 
    secure: false,
    auth: {
        user: "a60b796a0551d4",
        pass: "736360cac8ada8",
    },
});

module.exports = {
    sendMail: async function (to, password) {
        const info = await transporter.sendMail({
            from: 'admin@gmail.com',
            to: to,
            subject: "Tài khoản của bạn",
            text: `Password của bạn là: ${password}`,
            html: `
                <h3>Chào bạn 👋</h3>
                <p>Tài khoản của bạn đã được tạo thành công.</p>
                <p><b>Password của bạn là:</b> ${password}</p>
            `,
        });

        console.log("Message sent:", info.messageId);
    }
};