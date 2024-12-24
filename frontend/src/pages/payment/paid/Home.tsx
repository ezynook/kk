import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import "./Home.css";
import { Booking } from "../../../interfaces/IBooking";
import { GetBooking } from "../../../services/https/BookingAPI";
import { PromotionInterface } from "../../../interfaces/IPromotion";
import { GetPromotion } from "../../../services/https/PromotionAPI";
import { GetStatus } from "../../../services/https/indexpromotion";
import { Status } from "../../../interfaces/IStatus";
import { Paymentx } from "../../../interfaces/IPayment";
const HomePayment: React.FC = () => {
	const navigate = useNavigate();
	const [hovered, setHovered] = useState(false);
	const [promotionCode, setPromotionCode] = useState("");
	const [isEditMode, setIsEditMode] = useState(false);
	const [isUsed, setIsUsed] = useState(false);
	/*const [totalCost, setTotalCost] = useState(120.0); */
	const [estimatedCost, setEstimatedCost] = useState("");
	const [startLocation, setStartLocation] = useState<string>("");
	const [discount, setdiscount] = useState("");
	const [summery, setSummery] = useState(0.0);
	const [booking, setBooking] = useState<Booking[]>([]);
	const [promotions, setPromotions] = useState<PromotionInterface[]>([]);
	const [status, setStatus] = useState([]); // State สำหรับเก็บสถานะโปรโมชั่น
	const [totalCost, setTotalCost] = useState(booking.length > 0 ? booking[0].TotalPrice : 0); // Default to initial estimated cost

	const fetchBooking = async () => {
		try {
			const response = await GetBooking(); // เรียก API
			if (Array.isArray(response.data)) {
				setBooking(response.data); // กำหนดค่าเป็นอาร์เรย์ที่ได้จาก API
				localStorage.setItem("book_id", response.data[0].ID);
				localStorage.setItem("total_price", response.data[0].total_price);
				setSummery(response.data[0].total_price.toFixed(2));
			} else {
				console.error("Unexpected response format:", response);
				setBooking([]); // หากไม่ได้ข้อมูลที่เป็น array ให้ตั้งค่าเป็น []
			}
		} catch (error) {
			console.error("Error fetching bookings:", error);
			setBooking([]); // ตั้งค่าเริ่มต้นเมื่อเกิดข้อผิดพลาด
		}
	};



	const fetchPromotions = async () => {
		try {
			const response = await GetPromotion();
			if (Array.isArray(response)) {
				setPromotions(response);
			} else {
				console.error("Unexpected response format:", response);
				setPromotions([]);
			}
		} catch (error) {
			console.error("Error fetching promotions:", error);
		}
	};

	// ฟังก์ชันสำหรับดึงข้อมูลสถานะ
	/*const fetchStatuss = async () => {
	  try {
		const response = await GetStatus(); // ดึงข้อมูลจาก API
		console.log("Fetched status:", response); // Log ข้อมูลที่ได้
		if (Array.isArray(response)) {
		  setStatus(response); // หากได้ข้อมูลในรูปแบบ Array อัปเดตสถานะ
		} else {
		  console.error("Unexpected response format:", response); // กรณีข้อมูลไม่เป็น Array
		  setStatus([]); // กำหนดค่าเป็น Array ว่าง
		}
	  } catch (error) {
		console.error("Error fetching status:", error); // Handle errors
	  }
	};*/

	useEffect(() => {
		fetchBooking();
		fetchPromotions();
		/*fetchStatuss(); // เรียกใช้ฟังก์ชันนี้ตอน component mount*/
	}, []);
	const menuItems = [
		{ name: "Home", icon: "https://cdn-icons-png.flaticon.com/128/18390/18390765.png", route: "/paid" },
		{ name: "Payment", icon: "https://cdn-icons-png.flaticon.com/128/18209/18209461.png", route: "/payment" },
		{ name: "Review", icon: "https://cdn-icons-png.flaticon.com/128/7656/7656139.png", route: "/review" },
		{ name: "History", icon: "https://cdn-icons-png.flaticon.com/128/9485/9485945.png", route: "/review/history" },
	];

	const handleMenuClick = (item: { name: string; icon: string; route: string }) => {
		navigate(item.route);
	};
	const handleMapClick = () => {
		window.open("https://www.google.com/maps", "_blank"); // Replace with actual map URL
	};
	const handleProceed = () => {
		if (isUsed || !promotionCode) {
			navigate("/payment");
		} else {
			alert("Please enter a valid promotion code or ensure it's not already used.");
		}
	};

	const handleCancel = () => {
		// console.log("Cancelled");
	};
	const handleEdit = () => {
		setIsEditMode(true);
		setIsUsed(false); // Reset the "used" state when editing
	};

	const handleUpdate = () => {
		if (!promotionCode.trim()) {
			setPromotionCode("None");
			setSummery(parseFloat(booking[0].total_price).toFixed(2))
			alert("Promotion code cannot be blank. Resetting to 'None'.");
			navigate("/payment");
		} else {
			fetch(`http://127.0.0.1:8000/get/promotion?code=${promotionCode.trim()}`)
				.then((response) => {
					if (!response.ok) {
						throw new Error('Network response was not ok');
					}
					return response.json();
				})
				.then((data) => {
					try {
						setIsUsed(false);
						const total_price = parseFloat(booking[0].total_price).toFixed(2);
						if (data.data[0].is_type == 1) {
							setSummery(total_price);
						} else {
							setSummery(total_price);
						}
						setPromotionCode(data.data[0].promotion_code);
						alert("Stored: " + promotionCode);
					} catch {
						alert("Promotion not found");
					}
				})
				.catch((error) => {
					console.log(error);
				});
		}

		setIsEditMode(false); // Reset to view mode after update
	};


	const handleUsed = () => {
		if (!promotionCode.trim() || promotionCode === "None") {
			alert("No valid promotion code applied.");
		} else {
			fetch(`http://127.0.0.1:8000/get/promotion?code=${promotionCode.trim()}`)
			.then((response) => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				return response.json();
			})
			.then((data) => {
				try {
					const total_price = parseFloat(booking[0].total_price).toFixed(2);
					if (data.data[0].is_type == 1) {
						setSummery(parseFloat(data.data[0].discount - total_price).toFixed(2))
					} else {
						setSummery(parseFloat(total_price * (1 - data.data[0].discount / 100)).toFixed(2))
					}
				} catch {
					alert("Promotion code not found.");
				}
				setIsUsed(true);
				setIsEditMode(false);
			})
			.catch((e) => {
				alert("Promotion code is not valid or not active.");
			});
		}
	};



	return (
		<div className="aa">
			<div className="payment-page">
				{/* Sidebar */}
				<div className="sidebar">
					{menuItems.map((item) => (
						<div
							key={item.name}
							className="menu-item"
							onClick={() => handleMenuClick(item)}
						>
							<img src={item.icon} alt={item.name} className="menu-icon" />
							<p className="menu-text">{item.name}</p>
						</div>
					))}
				</div>

				{/* Main Content */}
				<div className="main-content">
					<div className="headerx">
						<h1>PAYMENT</h1>
						<div className="progress-indicator">
							<div className="circle filled"></div>
							<div className="circle"></div>
							<div className="circle"></div>
						</div>
					</div>
					<div className="content-wrapper">
						<div className="information-container">
							<h2>INFORMATION</h2>
							<div className="information-details">
								<div className="row">
									<span className="label-with-icon">
										<img
											src="https://cdn-icons-png.flaticon.com/128/854/854904.png"
											alt="Starting Point Icon"
											className="info-icon"
										/>
										Starting Point:
									</span>
									<span>
										{booking.length > 0
											? booking.map((b, index) => (
												<span key={index}>
													{b.beginning} {/* ดึงชื่อสถานที่จาก Beginning */}
													{index < booking.length - 1 && ", "}
												</span>
											))
											: "..."}
									</span>


								</div>
								<div className="row">
									<span className="label-with-icon">
										<img
											src="https://cdn-icons-png.flaticon.com/128/1257/1257385.png"
											alt="Destination Icon"
											className="info-icon"
										/>
										Destination:
									</span>
									<span>
										{booking.length > 0
											? booking.map((b, index) => (
												<span key={index}>
													{b.terminus} {/* ดึงชื่อสถานที่จาก Destination */}
													{index < booking.length - 1 && ", "}
												</span>
											))
											: "Loading..."}
									</span>
								</div>
								<div className="row">
									<span className="label-with-icon">
										<img
											src="https://cdn-icons-png.flaticon.com/128/5488/5488668.png"
											alt="Vehicle Type Icon"
											className="info-icon"
										/>
										Vehicle Type:
									</span>
									<span>
										{booking.length > 0
											? booking.map((b, index) => (
												<span key={index}>
													{b.vehicle} {/* ดึงข้อมูล Vehicle จาก Booking */}
													{index < booking.length - 1 && ", "}
												</span>
											))
											: "Loading..."}
									</span>
								</div>
								<div className="row">
									<span className="label-with-icon">
										<img
											src="https://cdn-icons-png.flaticon.com/128/2382/2382625.png"
											alt="Estimated Cost Icon"
											className="info-icon"
										/>
										Estimated Cost:
									</span>
									<span>{booking.length > 0 ? parseFloat(booking[0].total_price).toFixed(2) : "Loading..."} Baht</span>
								</div>
								<div className="row">
									<span className="promotion-label">

										<img
											src="https://cdn-icons-png.flaticon.com/128/6632/6632881.png"
											alt="Promo Code Icon"
											className="promo-code-icon"
										/>
										Promotion Code:
									</span>
									{isEditMode ? (
										<input
											type="text"
											value={promotionCode}
											onChange={(e) => setPromotionCode(e.target.value)}
											className="promo-input"
										/>
									) : (
										<span className="promo-value">{promotionCode || "No Promotion"}</span>
									)}
								</div>


								{/* Buttons moved to a separate container */}
								<div className="promotion-actions">
									<button className="used-button" onClick={handleUsed}>
										Used
									</button>
									<button className="edit-button" onClick={handleEdit}>
										Edit
									</button>
									<button
										className="update-button"
										onClick={handleUpdate}
										disabled={!isEditMode}
									>
										Update
									</button>
								</div>
								<div className="row">
									<span>Total Cost:</span>
									<span>
										{/* {promotionCode && isUsed ? (
          promotions.find(
            (promo) => promo.promotion_code === promotionCode
          )?.DiscountTypeID === 1 ? (
            `${(estimatedCost - promotions.find((promo) => promo.promotion_code === promotionCode)?.discount).toFixed(2)} Baht`
          ) : (
            `${(estimatedCost * (1 - (promotions.find((promo) => promo.promotion_code === promotionCode)?.discount || 0) / 100)).toFixed(2)} Baht`
          )
        ) : (
          `${booking.length > 0 ? parseFloat(booking[0].total_price).toFixed(2) : "Loading..."} Baht`
        )} */}
										{summery} Baht
									</span>

								</div>

							</div>
						</div>
						<div className="avatar-container">
							<div
								className="avatar-frame"
								onMouseEnter={() => setHovered(true)}
								onMouseLeave={() => setHovered(false)}
							>
								<div className="blinking-light"></div> {/* Blinking Light */}
								<img
									src={
										hovered
											? "https://cdn-icons-png.flaticon.com/128/854/854878.png"
											: "https://cdn-icons-png.flaticon.com/512/16802/16802273.png"
									}
									alt="User Avatar"
									className="avatar-img"
								/>
							</div>
							<p className="booking-text">
								Booking:
								{booking.length > 0 ? (
									<ul>
										{booking.map((b, index) => (
											<li key={index}>Booking ID: {b.ID}</li>

										))}
									</ul>
								) : (
									<span>No bookings available</span>
								)}
							</p>

							<p className="distance-text">
								Distance:{" "}
								{booking.length > 0
									? booking.map((b, index) => (
										<span key={index}>
											{b.distance} KM
											{index < booking.length - 1 && ", "} {/* คั่นด้วย , ถ้าไม่ใช่รายการสุดท้าย */}
										</span>
									))
									: "Loading..."}
							</p>
							<div className="tgx" onClick={handleMapClick}>
								<img
									src="https://img.freepik.com/premium-vector/map-with-destination-location-point-city-map-with-street-river-gps-map-navigator-concept_34645-1078.jpg"
									alt="Map Preview"
									className="map-img"
								/>

							</div>
							<p className="map-label">View Map</p>
						</div>
					</div>

					<div className="buttons">
						<button className="proceed-button" onClick={handleProceed}>
							Proceed to Payment
						</button>
						<button className="cancel-button" onClick={handleCancel}>
							Cancel
						</button>
					</div>
					<Outlet />
				</div>
			</div>
		</div>
	);
};

export default HomePayment;
function setTotalCost(arg0: number) {
	throw new Error("Function not implemented.");
}

