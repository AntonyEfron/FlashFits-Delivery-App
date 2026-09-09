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

// Rider enters customer OTP to end the timer and calculate amount
export const EndTrialPhaseApi = async ({ orderId, otp }) => {
  try {
    const response = await axiosInstance.post("/deliveryRider/order/endTrialPhase", { orderId, otp });
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

export const ConfirmQrCollectionApi = async ({ orderId }) => {
  try {
    const response = await axiosInstance.post(`/deliveryRider/orders/${orderId}/confirm-qr-collection`);
    return response.data;
  } catch (error) {
    console.error("❌ ConfirmQrCollectionApi:", error.response?.data || error.message);
    throw error;
  }
};

export const ReportDeliveryFeeRefusalApi = async ({ orderId }) => {
  try {
    const response = await axiosInstance.post(`/deliveryRider/orders/${orderId}/report-delivery-fee-refusal`);
    return response.data;
  } catch (error) {
    console.error("❌ ReportDeliveryFeeRefusalApi:", error.response?.data || error.message);
    throw error;
  }
};

export const ConfirmCashCollectionApi = async ({ orderId }) => {
  try {
    const cleanId = String(orderId).replace(/^["']|["']$/g, '').trim();
    const response = await axiosInstance.post(`/deliveryRider/orders/${cleanId}/confirm-cash-collection`, { orderId: cleanId });
    return response.data;
  } catch (error) {
    console.error("❌ ConfirmCashCollectionApi:", error.response?.data || error.message);
    throw error;
  }
};

export const UploadReturnPhotosApi = async ({ orderId, photoUris }) => {
  try {
    const cleanId = String(orderId).replace(/^["']|["']$/g, '').trim();
    const formData = new FormData();
    formData.append("orderId", cleanId);

    const uris = Array.isArray(photoUris) ? photoUris : [photoUris].filter(Boolean);
    uris.forEach((uri, index) => {
      const filename = uri.split('/').pop() || `return_photo_${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append("photos", {
        uri,
        name: filename,
        type,
      });
    });

    const response = await axiosInstance.post("/deliveryRider/order/return-photos", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ UploadReturnPhotosApi:", error.response?.data || error.message);
    throw error;
  }
};

