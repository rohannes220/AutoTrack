// Two-letter US state codes plus DC, used for a vehicle's registration state.
export const US_STATE_CODES = Object.freeze(
  (
    'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO ' +
    'MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'
  ).split(' '),
);

// The first production automobile; earlier model years are rejected.
export const FIRST_MODEL_YEAR = 1886;
