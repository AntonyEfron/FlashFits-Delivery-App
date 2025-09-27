// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://7a3d6090f746.ngrok-free.app", // change to your backend URL
      },
    };
  };
  