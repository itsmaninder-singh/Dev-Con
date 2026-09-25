import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const ALLOWED_EXPERIENCE = ["Fresher", "1-2 years", "2-5 years", "5+ years"];


const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchUsers = asyncHandler(async (req, res) => {
  const {
    q,
    skills,
    college,
    experience,
    availableFor,
    onlyAvailable,
    excludeConnected,
    page = 1,
    limit = 20,
  } = req.query;

  const filter = {};

  if (q && q.trim()) {
    const safe = escapeRegex(q.trim().slice(0, 100));
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { username: { $regex: safe, $options: "i" } },
      { bio: { $regex: safe, $options: "i" } },
    ];
  }

  if (skills) {
    const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
    if (skillList.length) {
      filter.skills = {
        $in: skillList.map((s) => new RegExp(`^${escapeRegex(s)}$`, "i")),
      };
    }
  }

  if (college) {
    filter.college = { $regex: escapeRegex(college.trim()), $options: "i" };
  }

  if (experience) {
    if (!ALLOWED_EXPERIENCE.includes(experience)) {
      return res
        .status(400)
        .json(new ApiResponse(400, "No results - invalid experience filter", { results: [], total: 0 }));
    }
    filter.experience = experience;
  }

  if (availableFor) {
    const list = availableFor.split(",").map((s) => s.trim()).filter(Boolean);
    if (list.length) filter.AvailableFor = { $in: list };
  }

  if (onlyAvailable === "true") {
    filter.isAvailable = true;
  }

  if (req.user) {
    if (excludeConnected === "true") {
      const freshUser = await User.findById(req.user._id).select("connections");
      const myConns = (freshUser?.connections || req.user.connections || []).map((id) => (id?._id || id).toString());
      const pendingSent = await Notification.find({
        sender: req.user._id,
        type: "connect_request",
      }).select("recipient");
      const pendingRecipientIds = (pendingSent || []).map((n) => n.recipient?.toString()).filter(Boolean);
      filter._id = { $nin: [req.user._id.toString(), ...myConns, ...pendingRecipientIds] };
    } else {
      filter._id = { $ne: req.user._id };
    }
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
  const skip = (pageNum - 1) * limitNum;

  const [results, total] = await Promise.all([
    User.find(filter)
      .select("name username profilePicture bio college skills experience isAvailable AvailableFor reputation")
      .sort({ "reputation.score": -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  const freshMe = req.user ? await User.findById(req.user._id).select("connections") : null;
  const myConnections = new Set(
    (freshMe?.connections || req.user?.connections || []).map((id) => (id?._id || id || "").toString()).filter(Boolean)
  );

  const formattedResults = results.map((u) => {
    const obj = u.toObject ? u.toObject() : { ...u };
    obj.isConnected = myConnections.has(obj._id.toString());
    return obj;
  });

  return res.status(200).json(
    new ApiResponse(200, "Search results fetched", {
      results: formattedResults,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    })
  );
});

export { searchUsers };
