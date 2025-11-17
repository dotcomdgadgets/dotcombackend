export const checkAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access blocked! Only admin can update roles." });
  }
  next();
};




