import axiosInstance from "../../config/axiosConfig";

// ✅ Accept order
export const AcceptOrderApi = async (orderId) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/acceptOrder", { orderId });
    return response.data;
  } catch (error) {
    console.error("❌ AcceptOrderApi:", error.response?.data || error.message);
    throw error;
  }
};

export const ReachPickUpLocation = async ({ orderId, coordinates }) => {
  try {
    const { lat, lng } = coordinates;
    const response = await axiosInstance.post("/deliveryRider/order/reachedPickupLocation", {
      orderId, latitude: lat, longitude: lng,
    });
    return response.data;
  } catch (error) {
    console.error("❌ ReachPickUpLocation:", error.response?.data || error.message);
    throw error;
  }
};

export const VerifyPickupOtpApi = async ({ orderId, otp }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/verifyOtp", { orderId, otp });
    return response.data;
  } catch (error) {
    console.error("❌ VerifyPickupOtpApi:", error.response?.data || error.message);
    throw error;
  }
};

export const ReachedCustomerLocationApi = async ({ orderId, latitude, longitude }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/reachedCustomerLocation", {
      orderId, latitude, longitude,
    });
    return response.data;
  } catch (error) {
    console.error("❌ ReachedCustomerLocationApi:", error.response?.data || error.message);
    throw error;
  }
};

export const HandoverPackageApi = async ({ orderId, otp }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/handOutProducts", { orderId, otp });
    return response.data;
  } catch (error) {
    console.error("❌ HandoverPackageApi:", error.response?.data || error.message);
    throw error;
  }
};

// Rider signals the timer has ended — customer selection takes over
export const EndTrialPhaseApi = async ({ orderId }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/endTrialPhase", { orderId });
    return response.data;
  } catch (error) {
    console.error("❌ EndTrialPhaseApi:", error.response?.data || error.message);
    throw error;
  }
};

// Rider arrives back at merchant with returned items
export const ReachedReturnMerchantApi = async ({ orderId, latitude, longitude }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/reachedReturnMerchant", {
      orderId, latitude, longitude,
    });
    return response.data;
  } catch (error) {
    console.error("❌ ReachedReturnMerchantApi:", error.response?.data || error.message);
    throw error;
  }
};

// Verify the return OTP given by the merchant
export const ReturnVerificationApi = async ({ orderId, otp }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/verifyMerchantReturnOtp", {
      orderId, otp,
    });
    return response.data;
  } catch (error) {
    console.error("❌ ReturnVerificationApi:", error.response?.data || error.message);
    throw error;
  }
};

export const ReturnItemVerificationApi = async ({ orderId, otp }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/verifyOtpOnReturn", {
      orderId, otp,
    });
    return response.data;
  } catch (error) {
    console.error("❌ ReturnItemVerificationApi:", error.response?.data || error.message);
    throw error;
  }
};

export const GetActiveOrderApi = async () => {
  try {
    const response = await axiosInstance.get("/deliveryRider/order/active");
    return response.data;
  } catch (error) {
    console.error("❌ GetActiveOrderApi:", error.response?.data || error.message);
    throw error;
  }
};

