// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://25b0cbcfccf8.ngrok-free.app", // change to your backend URL
      },
    };
  };