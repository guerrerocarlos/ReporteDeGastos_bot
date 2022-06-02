const config = {
  service: "reportedegastos-bot",
  frameworkVersion: "3",
  plugins: ["serverless-offline"],
  provider: {
    name: "aws",
    runtime: "nodejs12.x",
    lambdaHashingVersion: 20201221,
    region: "eu-west-3",
    timeout: 30,
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: "arn:aws:s3:::r3js",
          },
          {
            Effect: "Allow",
            Action: ["s3:*"],
            Resource: "arn:aws:s3:::r3js/*",
          },
        ],
      },
    },
  },
  functions: {
    handler: {
      handler: "handler.handler",
      events: [
        {
          http: {
            path: "/webhook",
            method: "any",
            cors: true,
          },
        },
      ],
    },
    sendReminder: {
      handler: "handler.sendReport",
      events: [{ schedule: "cron(0 15 1 * ? *)" }],
    },
  },
};

config.provider["environment"] = {};
config.provider["environment"]["BOT_TOKEN"] = process.env.BOT_TOKEN;
config.provider["environment"]["BUCKET"] = process.env.BUCKET;
config.provider["environment"]["PREFIX"] = process.env.PREFIX;

console.log(config);

module.exports = config;
