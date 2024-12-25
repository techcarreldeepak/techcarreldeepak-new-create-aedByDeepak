const axios = require("axios");
require("dotenv").config();

const getCurrentDateTime = () => {
  const now = new Date();
  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Kolkata",
  };
  // console.log(now.toLocaleString("en-US", options));
  return now.toLocaleString("en-US", options);
};
getCurrentDateTime();
const error_detector = async (
  errMessage,
  errUrl,
  errFileName,
  request_body,
  response_body
) => {
  let data = JSON.stringify({
    channel: "C07SAPTCAGP",
    attachments: [
      {
        color: "#ff0000",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: ":exclamation: *Error Notification*",
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Date & Time:*\n${getCurrentDateTime()}`,
              },
              {
                type: "mrkdwn",
                text: `*Message:*\n${errMessage}`,
              },
              {
                type: "mrkdwn",
                text: `*File Name:*\n${errFileName || "Not available"}`,
              },
              {
                type: "mrkdwn",
                text: `*Environment:*\n${process.env.ENVIRONMENT || "Not available"
                  }`,
              },
              {
                type: "mrkdwn",
                text: `*API URL:*\n${errUrl || "Not available"}`,
              },
            ],
          },
          {
            type: "divider",
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*Request Body:*\n\`\`\`${JSON.stringify(
                  request_body,
                  null,
                  2
                )}\`\`\``,
                verbatim: true,
              },
              {
                type: "mrkdwn",
                text: `*Response Body:*\n\`\`\`${JSON.stringify(
                  response_body,
                  null,
                  2
                )}\`\`\``,
                verbatim: true,
              },
            ],
          },
        ],
      },
    ],
  });
  const slackToken = process.env.SLACK_API_TOKEN;

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://slack.com/api/chat.postMessage",
    headers: {
      Authorization:
        `Bearer ${slackToken}`,
      "Content-type": "application/json",
    },
    data: data,
  };

  try {
    const slackResponse = await axios.request(config);
    // console.log(JSON.stringify(slackResponse.data));
  } catch (error) {
    console.error("Error sending to Slack:", error);
  }
};

// error_detector("some","asds","adsa","{asdasd}","{asdasd}")

module.exports = { error_detector };
