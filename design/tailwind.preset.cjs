const tokens = require('./tokens.json');

const values = (group) => Object.fromEntries(
  Object.entries(group).map(([key, token]) => [key, token.$value])
);

module.exports = {
  theme: {
    extend: {
      colors: {
        amber: tokens.color.brand.amber.$value,
        ink: tokens.color.dark.canvas.$value,
        steel: {
          900: tokens.color.dark.surface.$value,
          800: tokens.color.dark.raised.$value,
          300: tokens.color.dark.text.$value
        },
        paper: tokens.color.light.canvas.$value
      },
      fontFamily: {
        sans: tokens.font.family.sans.$value.split(', '),
        editorial: tokens.font.family.editorial.$value.split(', '),
        mono: tokens.font.family.mono.$value.split(', ')
      },
      fontSize: values(tokens.font.size),
      spacing: values(tokens.space),
      borderRadius: values(tokens.radius),
      boxShadow: values(tokens.shadow),
      maxWidth: {
        content: tokens.layout.content.$value,
        reading: tokens.layout.reading.$value
      },
      transitionDuration: {
        instant: tokens.motion.instant.$value.replace('ms', ''),
        fast: tokens.motion.fast.$value.replace('ms', ''),
        base: tokens.motion.base.$value.replace('ms', ''),
        slow: tokens.motion.slow.$value.replace('ms', '')
      }
    }
  }
};
