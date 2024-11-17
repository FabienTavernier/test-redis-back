export const checkAuth = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.username) {
    return next();
  } else {
    return res.status(401).json({ msg: "Accès non autorisé" });
  }
};
