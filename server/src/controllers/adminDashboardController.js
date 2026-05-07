import Booking from "../models/Booking.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import ContactMessage from "../models/ContactMessage.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const { period } = req.query;

    const days = parseInt(period, 10) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const priorStartDate = new Date(startDate);
    priorStartDate.setDate(priorStartDate.getDate() - days);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [bookingStats, activeUsers, activeEvents, dailyBookingsAgg, priorBookingStats, priorActiveUsers, newEventsThisWeek] = await Promise.all([
      Booking.aggregate([
        { $match: { status: "confirmed", createdAt: { $gte: startDate }}},
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            totalTickets: { $sum: "$quantity" },
          },
        },
      ]),
      User.countDocuments({ role: "user", createdAt: { $gte: startDate,} }),
      
      Event.countDocuments({ status: { $in: ["upcoming", "ongoing"],}, createdAt: { $gte: startDate, }},),

      Booking.aggregate([
        { $match: { status: "confirmed", createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            bookings: { $sum: 1 },
          },
        },
      ]),
      Booking.aggregate([
        { $match: { status: "confirmed", createdAt: { $gte: priorStartDate, $lt: startDate }}},
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            totalTickets: { $sum: "$quantity" },
          },
        },
      ]),
      User.countDocuments({ role: "user", createdAt: { $gte: priorStartDate, $lt: startDate } }),
      Event.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
    ]);

    const chartData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split("T")[0];

      const dailyStat = dailyBookingsAgg.find((stat) => stat._id === dateString);
      chartData.push({
        date: dateString,
        bookings: dailyStat ? dailyStat.bookings : 0,
      });
    }

    const currentRevenue = bookingStats.length > 0 ? bookingStats[0].totalRevenue : 0;
    const currentTickets = bookingStats.length > 0 ? bookingStats[0].totalTickets : 0;
    const priorRevenue = priorBookingStats.length > 0 ? priorBookingStats[0].totalRevenue : 0;
    const priorTickets = priorBookingStats.length > 0 ? priorBookingStats[0].totalTickets : 0;

    const calculatePercentageChange = (current, prior) => {
      if (prior === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prior) / prior) * 100);
    };

    res.status(200).json({
      success: true,
      message: "Dashboard statistics retrieved successfully",
      data: {
        totalRevenue: currentRevenue,
        ticketsSold: currentTickets,
        activeUsers,
        activeEvents,
        revenueChange: calculatePercentageChange(currentRevenue, priorRevenue),
        ticketsChange: calculatePercentageChange(currentTickets, priorTickets),
        activeUsersChange: calculatePercentageChange(activeUsers, priorActiveUsers),
        newEventsThisWeek,
        chartData,
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getRecentBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ status: { $in: ["confirmed", "pending"],} })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("eventId", "title")
      .select("_id createdAt quantity eventId status");

    const data = bookings.map((b) => ({
      id: b._id,
      createdAt: b.createdAt,
      eventTitle: b.eventId?.title || "Unknown Event",
      quantity: b.quantity,
      status: b.status,
    }));

    res.status(200).json({
      success: true,
      message: "Recent bookings retrieved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getNeedsAttention = async (req, res, next) => {
  try {
    const now = new Date();
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(oneWeekAgo);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 7);

    const [upcomingLowSalesCount, unreadMessagesCount, oldestUnreadMessage, newMembersThisWeek, newMembersPriorWeek] =
      await Promise.all([
        Event.aggregate([
          {
            $match: {
              date: { $gte: now, $lte: in48Hours },
              status: { $in: ["upcoming", "ongoing"] },
            },
          },
          {
            $lookup: {
              from: "bookings",
              let: { eventId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$eventId", "$$eventId"] },
                        { $eq: ["$status", "confirmed"] },
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    confirmedTickets: { $sum: "$quantity" },
                  },
                },
              ],
              as: "bookingStats",
            },
          },
          {
            $addFields: {
              confirmedTickets: {
                $ifNull: [{ $arrayElemAt: ["$bookingStats.confirmedTickets", 0] }, 0],
              },
            },
          },
          { $match: { confirmedTickets: { $lt: 10 } } },
          { $count: "count" },
        ]),
        ContactMessage.countDocuments({ status: "new" }),
        ContactMessage.findOne({ status: "new" }).sort({ createdAt: 1 }).select("createdAt"),
        User.countDocuments({
          role: "user",
          createdAt: { $gte: oneWeekAgo },
        }),
        User.countDocuments({
          role: "user",
          createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
        }),
      ]);

    const oldestHours = oldestUnreadMessage?.createdAt
      ? Math.max(
          0,
          Math.floor((now.getTime() - new Date(oldestUnreadMessage.createdAt).getTime()) / (1000 * 60 * 60)),
        )
      : 0;

    res.status(200).json({
      success: true,
      message: "Needs attention summary retrieved successfully",
      data: {
        lowSalesUpcomingEvents48h: upcomingLowSalesCount?.[0]?.count ?? 0,
        unreadMessages: {
          count: unreadMessagesCount,
          oldestHours,
        },
        newMembers: {
          thisWeek: newMembersThisWeek,
          priorWeek: newMembersPriorWeek,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};