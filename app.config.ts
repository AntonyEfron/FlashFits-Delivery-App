// app.config.js
export default ({ config }) => {
    return {
      ...config,
      extra: {
        BACKEND_URL: "https://c002cf4de529.ngrok-free.app", // change to your backend URL
      },
    };
  };
 