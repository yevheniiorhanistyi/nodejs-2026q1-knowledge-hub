export default () => ({
  crypto: {
    saltRounds: (() => {
      const salt = Number(process.env.CRYPT_SALT);
      return Number.isInteger(salt) && salt > 0 ? salt : 10;
    })(),
  },
});
