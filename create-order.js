export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed"
    });
  }

  const apiKey = process.env.OMS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      message: "Server configuration error"
    });
  }

  try {
    const {
      name,
      phone,
      click_id,
      request_id,
      fbclid,
      ttclid,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content
    } = req.body || {};

    if (!name || !phone || !click_id || !request_id) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, click ID, and request ID are required."
      });
    }

    const orderData = {
      name: String(name).trim(),
      phone: String(phone).trim(),

      // Singapore campaign IDs
      offer_id: "herbal-powder-sg",
      product_id: "product-herbal-powder-sg",

      // Partner and tracking information
      ref: "partner-oyedejiabeebullah",
      click_id: String(click_id).trim(),
      request_id: String(request_id).trim()
    };

    const optionalFields = {
      fbclid,
      ttclid,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content
    };

    for (const [key, value] of Object.entries(optionalFields)) {
      if (value) {
        orderData[key] = String(value);
      }
    }

    const response = await fetch(
      "https://slimliefshop.com/api/v1/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey
        },
        body: JSON.stringify(orderData),
        signal: AbortSignal.timeout(20000)
      }
    );

    const responseText = await response.text();

    let result;

    try {
      result = responseText ? JSON.parse(responseText) : {};
    } catch {
      result = { message: responseText };
    }

    if (response.status === 201) {
      return res.status(201).json({
        success: true,
        message: "Order submitted successfully.",
        data: result,
        order_number:
          result.order_number ||
          result.data?.order_number ||
          null
      });
    }

    return res.status(
      response.status >= 400 ? response.status : 502
    ).json({
      success: false,
      message:
        result.message ||
        "The advertiser could not confirm the order.",
      data: result
    });

  } catch (error) {
    console.error("Order submission error:", error.message);

    return res.status(500).json({
      success: false,
      message:
        "Unable to confirm the order submission. Please check its status before retrying."
    });
  }
}