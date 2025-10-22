// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://ba5c185aab18.ngrok-free.app", // change to your backend URL
      },
    };
  };