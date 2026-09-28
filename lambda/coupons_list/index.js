exports.handler =  async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify([
      {
        coupon_id: '319326de971100158f6fa0daeec978fba1f17e4b',
        title: 'Save 20% on Fairmont hotels',
        description: 'Save 20% on Fairmont hotels when you book your stay through December 2022',
        coupon_code: 'SAVE20',
        campaign_id: 'CHRISTMAS2022',
        provider_id: 'FAIRMONT',
        provider_name: 'Fairmont Hotels and Resorts',
        start_date: '1669852800',
        end_date: '1672444800'
      },
      {
        coupon_id: '502a81d1564cf66c66e429d9e7c571f872151d2d',
        title: 'Save 25% when booking 10 or more days in Super 8 hotels',
        description: 'Save 25% on Super 8 hotels when you stay 10 or more days from December 1st, 2022 until January 31st, 2023',
        coupon_code: 'STAY10PLUS',
        campaign_id: 'S8STAY10',
        provider_id: 'SUPER8',
        provider_name: 'Super 8',
        start_date: '1669852800',
        end_date: '1675123200'
      },
      {
        coupon_id: '3f656e5fad7aa840efa7ab8c40118f011b9b9b5b',
        title: 'Save 10% on Hyatt hotels',
        description: 'Save 10% on Hyatt hotels worldwide when you book two or more stays in different countries through 2023',
        coupon_code: 'TRAVEL10',
        campaign_id: 'DISCOVER',
        provider_id: 'Hyatt',
        provider_name: 'Global Hyatt',
        start_date: '1672531200',
        end_date: '1703980800'
      }
    ])
  };
}
