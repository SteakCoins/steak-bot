module.exports = {
  apps: [
    {
      name: "app",
      script: "index.js",
      watch: true,
      ignore_watch: ["node_modules", "logs"],
    },
  ],
};
