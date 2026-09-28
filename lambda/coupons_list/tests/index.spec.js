const { handler } = require('../index.js');

describe('Coupon list', () => {

  test('Should return a list of coupons', async (done) => {

    const response = await handler({}, null);
    const responseParsed = JSON.parse(response.body);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(responseParsed)).toBe(true);
    expect(responseParsed.length).toBeGreaterThan(0);

    responseParsed.forEach((coupon) => {
      expect(coupon).toHaveProperty('coupon_id');
      expect(coupon).toHaveProperty('title');
      expect(coupon).toHaveProperty('description');
      expect(coupon).toHaveProperty('coupon_code');
      expect(coupon).toHaveProperty('campaign_id');
      expect(coupon).toHaveProperty('provider_id');
      expect(coupon).toHaveProperty('provider_name');
      expect(coupon).toHaveProperty('start_date');
      expect(coupon).toHaveProperty('end_date');
    });

    done();
  });
});
