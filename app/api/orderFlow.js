import axiosInstance from "../../config/axiosConfig";

// ✅ Exportable function to accept order
export const AcceptOrderApi = async (orderId) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/acceptOrder", {
      orderId,
    });
    console.log("✅ API Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error in AcceptOrderApi:", error.response?.data || error.message);
    throw error;
  }
};

export const ReachPickUpLocation = async ({ orderId, coordinates }) => {
console.log('reachedPickupLocation');

  try {
    const { lat, lng } = coordinates;
    const latitude  =  lat
    const longitude = lng
    const response = await axiosInstance.post(
      "deliveryRider/order/reachedPickupLocation",
      {
        orderId,
        latitude,
        longitude,
      }
    );
    console.log("📨 ReachPickup log sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error in ReachPickUpLocation:", error.response?.data || error.message);
    throw error;
  }
};

export const VerifyPickupOtpApi = async ({ orderId, otp }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/verifyOtp", {
      orderId,
      otp,
    });

    console.log("✅ OTP Verified:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error verifying OTP:", error.response?.data || error.message);
    throw error;
  }
};

export const ReachedCustomerLocationApi = async ({ orderId, latitude, longitude }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/reachedCustomerLocation", {
      orderId,
      latitude,
      longitude,
    });

    console.log("✅ Reached customer location logged:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Error marking reached customer location:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const HandoverPackageApi = async ({ orderId }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/handOutProducts", {
      orderId,
    });

    console.log("✅ Package handover logged:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Error marking package handover:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const ReturnVerificationApi = async ({ orderId, otp }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/returnVerification", {
      orderId,
      otp,
    });

    console.log("✅ Return verification logged:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Error marking return verification:",
      error.response?.data || error.message
    );
    throw error;
  }
};
