import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Tag,
  MessageCircle,
  Clock,
  Upload,
  ShieldAlert,
  Check,
  School,
  Lock,
  Mail,
  User,
  CreditCard,
  Image as ImageIcon,
  Users,
} from "lucide-react";
import { supabase } from "./supabaseClient";

// --- 자체 UI 컴포넌트 ---
const Card = ({ className = "", children }) => (
  <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const CardContent = ({ className = "", children }) => <div className={`p-5 ${className}`}>{children}</div>;

const Button = ({ className = "", variant = "default", disabled, children, onClick, type = "button" }) => {
  const baseStyle =
    "inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none rounded-xl px-4 py-2";
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900",
    danger: "bg-red-600 text-white hover:bg-red-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  };

  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

function X({ size }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// --- 유틸 함수 ---
const categories = ["전체", "물건", "OTT", "AI", "약속"];

function formatWon(value) {
  return value ? Number(value).toLocaleString("ko-KR") + "원" : "0원";
}

function ProgressBar({ current, total }) {
  const safeTotal = Math.max(Number(total || 0), 1);
  const safeCurrent = Number(current || 0);
  const percent = Math.min(100, Math.round((safeCurrent / safeTotal) * 100));

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between text-sm text-slate-500">
        <span>
          {safeCurrent}/{safeTotal}명 참여
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100">
        <div className="h-2.5 rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

// --- 공구 카드 컴포넌트 ---
function DealCard({ deal, onJoin, isJoined, onDelete, role }) {
  const isFull = Number(deal.current_people) >= Number(deal.total_people);
  const canSeeBankInfo = isJoined || deal.is_author;
  const canCancel = deal.is_author && !isFull;
  const canAdminDelete = role === "admin";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="transition hover:-translate-y-1 hover:shadow-md">
        {deal.image_url ? (
          <div className="h-32 w-full bg-slate-100">
            <img src={deal.image_url} alt={deal.title} className="h-full w-full object-cover object-center" />
          </div>
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-slate-100 text-slate-400">
            <ImageIcon size={32} />
          </div>
        )}

        <CardContent>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <Tag size={13} /> {deal.category}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{deal.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{deal.description || "상세 설명이 없습니다."}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                isFull ? "bg-slate-900 text-white" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {deal.status}
            </span>
          </div>

          <ProgressBar current={deal.current_people} total={deal.total_people} />

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-400">1인 예상가</p>
              <p className="mt-1 font-bold text-slate-900">{formatWon(deal.price)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-400">거래 장소</p>
              <p className="mt-1 font-bold text-slate-900">{deal.location || "미정"}</p>
            </div>
          </div>

          {canSeeBankInfo && deal.bank_info && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <CreditCard size={16} />
              <span>
                <b>송금 계좌:</b> {deal.bank_info}
              </span>
            </div>
          )}

          {!canSeeBankInfo && deal.bank_info && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
              <CreditCard size={16} />
              <span>참여 후 송금 계좌가 공개됩니다.</span>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Clock size={15} /> 마감일 {deal.deadline}
          </div>

          <div className="mt-5 flex gap-2">
            <Button onClick={() => onJoin(deal)} disabled={isFull || isJoined || deal.is_author} className={`flex-1 ${isJoined ? "!bg-emerald-600" : ""}`}>
              {deal.is_author ? "내가 만든 공구" : isJoined ? "참여 완료" : isFull ? "구매 진행중" : "참여하기"}
            </Button>

            <Button variant="outline">
              <MessageCircle size={17} />
            </Button>

            {(canCancel || canAdminDelete) && (
              <Button variant="danger" onClick={() => onDelete(deal)} className="px-3">
                삭제
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// --- 공구 등록 모달 ---
function CreateDealModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: "",
    category: "물건",
    price: "",
    totalPeople: "",
    deadline: "",
    location: "",
    description: "",
    bankInfo: "",
  });
  const [dealImage, setDealImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.title || !form.price || !form.totalPeople || !form.deadline || !form.bankInfo) {
      return alert("필수 항목을 모두 입력해주세요.");
    }

    if (Number(form.price) <= 0 || Number(form.totalPeople) < 2) {
      return alert("가격은 1원 이상, 모집 인원은 2명 이상이어야 합니다.");
    }

    try {
      setSubmitting(true);
      await onCreate(form, dealImage);
      setForm({ title: "", category: "물건", price: "", totalPeople: "", deadline: "", location: "", description: "", bankInfo: "" });
      setDealImage(null);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">공동구매 등록</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-3">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-4 hover:bg-slate-50">
            <Upload className="mb-1 text-slate-400" size={20} />
            <span className="text-xs text-slate-500">{dealImage ? dealImage.name : "물품 사진 선택 (선택)"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setDealImage(e.target.files[0])} />
          </label>

          <input className="rounded-xl border p-3 outline-none focus:border-blue-500" placeholder="제목" value={form.title} onChange={(e) => update("title", e.target.value)} />

          <select className="rounded-xl border p-3 outline-none" value={form.category} onChange={(e) => update("category", e.target.value)}>
            <option>물건</option>
            <option>OTT</option>
            <option>AI</option>
            <option>약속</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <input className="rounded-xl border p-3 outline-none" placeholder="1인 가격" type="number" value={form.price} onChange={(e) => update("price", e.target.value)} />
            <input className="rounded-xl border p-3 outline-none" placeholder="모집 인원" type="number" value={form.totalPeople} onChange={(e) => update("totalPeople", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input className="rounded-xl border p-3 outline-none" type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} />
            <input className="rounded-xl border p-3 outline-none" placeholder="장소/방식" value={form.location} onChange={(e) => update("location", e.target.value)} />
          </div>

          <input
            className="rounded-xl border border-amber-300 bg-amber-50 p-3 outline-none"
            placeholder="정산 계좌 (예: 신한 110-123 홍길동)"
            value={form.bankInfo}
            onChange={(e) => update("bankInfo", e.target.value)}
          />

          <textarea className="min-h-24 rounded-xl border p-3 outline-none" placeholder="상세 설명" value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>

        <Button onClick={submit} disabled={submitting} className="mt-5 w-full py-4 text-lg">
          {submitting ? "등록 중..." : "등록하기"}
        </Button>
      </motion.div>
    </div>
  );
}

// --- 메인 앱 ---
export default function AjouGroupBuyingApp() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const [idCardFile, setIdCardFile] = useState(null);
  const [deals, setDeals] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [joinedDeals, setJoinedDeals] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("전체");
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingDeals, setLoadingDeals] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("getSession error:", error);
          if (mounted) setRole("auth");
          return;
        }

        if (mounted) {
          await checkUserRole(data?.session?.user ?? null);
        }
      } catch (err) {
        console.error("initAuth error:", err);
        if (mounted) setRole("auth");
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUserRole(session?.user ?? null);
    });

    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        setRole((prev) => (prev === "loading" ? "auth" : prev));
      }
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  const checkUserRole = async (currentUser) => {
    try {
      if (!currentUser) {
        setUser(null);
        setRole("auth");
        return;
      }

      setUser(currentUser);

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!data || error) {
        setRole("auth");
        return;
      }

      setRole(data.role || "guest");
    } catch (err) {
      console.error(err);
      setRole("auth");
    }
  };

  const fetchJoinedDeals = async (currentUserId = user?.id) => {
    if (!currentUserId) return;

    const { data, error } = await supabase.from("deal_participants").select("deal_id").eq("user_id", currentUserId);

    if (!error && data) {
      setJoinedDeals(data.map((item) => item.deal_id));
    }
  };

  const fetchDeals = async () => {
    if (!user) return;

    setLoadingDeals(true);

    const { data, error } = await supabase.from("deals").select("*").order("id", { ascending: false });

    if (error) {
      alert("공구 목록을 불러오지 못했습니다: " + error.message);
      setLoadingDeals(false);
      return;
    }

    const mapped = (data || []).map((deal) => ({
      ...deal,
      is_author: deal.author_id === user.id,
    }));

    setDeals(mapped);
    setLoadingDeals(false);
  };

  const fetchVerifications = async () => {
    const { data, error } = await supabase.from("verifications").select("*").eq("status", "대기중").order("id", { ascending: false });

    if (!error && data) setPendingVerifications(data);
  };

  useEffect(() => {
    if (role === "student" || role === "admin") {
      fetchDeals();
      fetchJoinedDeals();
    }

    if (role === "admin") fetchVerifications();
  }, [role, user?.id]);

  const filteredDeals = useMemo(() => {
    return deals.filter((d) => {
      const title = d.title || "";
      const description = d.description || "";
      const keywordMatch = title.includes(keyword) || description.includes(keyword);
      const categoryMatch = category === "전체" || d.category === category;
      return categoryMatch && keywordMatch;
    });
  }, [deals, keyword, category]);

  const handleAuth = async (e) => {
    e.preventDefault();

    if (!email || !password) return alert("이메일과 비밀번호를 입력해주세요.");

    if (!email.endsWith("@ajou.ac.kr")) {
      return alert("아주대학교 이메일(@ajou.ac.kr)만 가입/로그인할 수 있습니다.");
    }

    if (password.length < 6) {
      return alert("비밀번호는 최소 6자 이상이어야 합니다.");
    }

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      error ? alert("가입 실패: " + error.message) : alert("가입 완료! 메일 인증 후 로그인해주세요.");
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert("로그인 실패: " + error.message);
        return;
      }

      await checkUserRole(data.user);
    }
  };

  const submitVerification = async () => {
    if (!idCardFile || !user) return alert("파일을 선택해 주세요.");

    try {
      const fileExt = idCardFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("id_cards").upload(fileName, idCardFile, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("id_cards").getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("verifications").insert([
        {
          user_id: user.id,
          id_card_url: publicUrlData.publicUrl,
          status: "대기중",
        },
      ]);

      if (insertError) throw insertError;

      alert("제출 완료! 관리자의 승인 후 이용할 수 있습니다.");
      setIdCardFile(null);
    } catch (error) {
      alert("인증 제출 실패: " + error.message);
    }
  };

  const createDeal = async (form, dealImage) => {
    if (!user) return;

    try {
      let uploadedImageUrl = null;

      if (dealImage) {
        const fileExt = dealImage.name.split(".").pop();
        const fileName = `${user.id}/deal-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from("deal_images").upload(fileName, dealImage, {
          cacheControl: "3600",
          upsert: false,
        });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("deal_images").getPublicUrl(fileName);
        uploadedImageUrl = data.publicUrl;
      }

      const { data: dealData, error: dealError } = await supabase
        .from("deals")
        .insert([
          {
            author_id: user.id,
            title: form.title,
            category: form.category,
            price: Number(form.price),
            total_people: Number(form.totalPeople),
            current_people: 1,
            deadline: form.deadline,
            location: form.location,
            description: form.description,
            image_url: uploadedImageUrl,
            bank_info: form.bankInfo,
            status: "모집중",
          },
        ])
        .select("id")
        .single();

      if (dealError) throw dealError;

      const { error: participantError } = await supabase.from("deal_participants").insert([
        {
          deal_id: dealData.id,
          user_id: user.id,
          role: "creator",
        },
      ]);

      if (participantError) throw participantError;

      alert("등록 완료!");
      await fetchDeals();
      await fetchJoinedDeals();
    } catch (error) {
      alert("공구 등록 실패: " + error.message);
    }
  };

  const joinDeal = async (deal) => {
    if (!user) return alert("로그인이 필요합니다.");
    if (deal.author_id === user.id) return alert("내가 만든 공구에는 참여할 수 없습니다.");
    if (joinedDeals.includes(deal.id)) return alert("이미 참여한 공구입니다.");
    if (Number(deal.current_people) >= Number(deal.total_people)) return alert("이미 마감된 공구입니다.");

    try {
      const { error: participantError } = await supabase.from("deal_participants").insert([
        {
          deal_id: deal.id,
          user_id: user.id,
          role: "participant",
        },
      ]);

      if (participantError) throw participantError;

      const nextPeople = Number(deal.current_people) + 1;
      const nextStatus = nextPeople >= Number(deal.total_people) ? "마감" : "모집중";

      const { error: updateError } = await supabase
        .from("deals")
        .update({
          current_people: nextPeople,
          status: nextStatus,
        })
        .eq("id", deal.id)
        .eq("current_people", deal.current_people);

      if (updateError) throw updateError;

      alert("참여 완료! 이제 송금 계좌를 확인할 수 있습니다.");
      await fetchDeals();
      await fetchJoinedDeals();
    } catch (error) {
      if (error.code === "23505") {
        alert("이미 참여한 공구입니다.");
      } else {
        alert("참여 실패: " + error.message);
      }
    }
  };

  const deleteDeal = async (deal) => {
    const isFull = Number(deal.current_people) >= Number(deal.total_people);

    if (deal.author_id === user.id && isFull && role !== "admin") {
      return alert("모집이 완료된 공구는 작성자가 취소할 수 없습니다.");
    }

    if (deal.author_id !== user.id && role !== "admin") {
      return alert("삭제 권한이 없습니다.");
    }

    const ok = window.confirm("정말 이 공구를 삭제하시겠습니까?");
    if (!ok) return;

    try {
      const { error } = await supabase.from("deals").delete().eq("id", deal.id);

      if (error) throw error;

      alert("삭제 완료!");
      await fetchDeals();
      await fetchJoinedDeals();
    } catch (error) {
      alert("삭제 실패: " + error.message);
    }
  };

  const approveStudent = async (verificationId, targetUserId) => {
    try {
      const { error: profileError } = await supabase.from("profiles").update({ role: "student" }).eq("id", targetUserId);
      if (profileError) throw profileError;

      const { error: verificationError } = await supabase.from("verifications").update({ status: "승인완료" }).eq("id", verificationId);
      if (verificationError) throw verificationError;

      alert("승인 완료!");
      fetchVerifications();
    } catch (error) {
      alert("승인 실패: " + error.message);
    }
  };

  const rejectVerification = async (verificationId) => {
    try {
      const { error } = await supabase.from("verifications").update({ status: "반려" }).eq("id", verificationId);
      if (error) throw error;
      alert("반려 처리 완료");
      fetchVerifications();
    } catch (error) {
      alert("반려 실패: " + error.message);
    }
  };

  if (role === "loading") {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 font-medium">연결 중...</div>;
  }

  if (role === "auth") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <School size={26} />
            </div>
            <h2 className="text-2xl font-black">아구공 시작하기</h2>
            <p className="mt-2 text-sm text-slate-500">아주대학교 이메일로만 이용할 수 있습니다.</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="email"
                placeholder="아주대 이메일 (@ajou.ac.kr)"
                className="w-full rounded-xl border p-3 pl-10 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="비밀번호"
                className="w-full rounded-xl border p-3 pl-10 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full py-4 text-lg">
              {isSignUp ? "회원가입" : "로그인"}
            </Button>
          </form>

          <div className="mt-5 text-center text-sm">
            <button onClick={() => setIsSignUp(!isSignUp)} className="font-bold text-blue-600">
              {isSignUp ? "로그인하기" : "회원가입하기"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-cyan-100 text-slate-900">
  <header className="sticky top-0 z-40 border-b border-sky-100 bg-white/80 backdrop-blur-md">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="아구공"
          className="h-14 w-14 rounded-full shadow-md"
        />

        <div>
          <h1 className="text-2xl font-black text-sky-700">
            아구공
          </h1>

          <div className="mt-1 flex gap-1 text-xs font-semibold text-slate-500">
            <span>아주대 공동구매 플랫폼</span>

            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700 uppercase">
              {role}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {role === "student" && (
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={18} className="mr-1" />
            공구 등록
          </Button>
        )}

        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setUser(null);
            setRole("auth");
            setDeals([]);
            setJoinedDeals([]);
            setPendingVerifications([]);
          }}
          className="rounded-2xl border border-sky-100 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-sky-50"
        >
          로그아웃
        </button>
      </div>
    </div>
  </header>

  <main className="mx-auto max-w-7xl px-5 py-8">

    {(role === "student" || role === "admin") && (
      <>
        <section className="mb-10 rounded-[2rem] bg-gradient-to-r from-sky-500 via-blue-500 to-blue-700 p-8 text-white shadow-xl">

          <h2 className="text-3xl font-black leading-tight">
            혼자 사면 비싸니까,
            <br />
            아주대생끼리 같이 사자.
          </h2>

          <p className="mt-3 text-sm text-blue-50">
            물건, OTT, AI 구독, 약속까지
            필요한 사람을 모아 부담을 줄여보세요.
          </p>

          <div className="mt-5 flex items-center gap-2 text-sm font-semibold">
            <Users size={17} />
            현재 등록된 공구 {deals.length}개
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

          <div className="relative max-w-sm flex-1">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={18}
            />

            <input
              className="w-full rounded-2xl border border-sky-100 bg-white p-3 pl-10 outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
              placeholder="검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  category === item
                    ? "bg-gradient-to-r from-blue-500 to-sky-400 text-white shadow-md"
                    : "border border-sky-100 bg-white hover:bg-sky-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loadingDeals ? (
          <Card>
            <CardContent className="text-sm text-slate-500">
              공구 목록을 불러오는 중입니다.
            </CardContent>
          </Card>
        ) : filteredDeals.length === 0 ? (
          <Card>
            <CardContent className="text-sm text-slate-500">
              조건에 맞는 공구가 없습니다.
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredDeals.map((deal) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="rounded-3xl border border-sky-100 bg-white transition hover:-translate-y-1 hover:shadow-2xl">

                  {deal.image_url ? (
                    <div className="h-32 w-full bg-slate-100">
                      <img
                        src={deal.image_url}
                        alt={deal.title}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                  ) : (
                    <div className="flex h-32 w-full items-center justify-center bg-slate-100 text-slate-400">
                      <ImageIcon size={32} />
                    </div>
                  )}

                  <CardContent>

                    <div className="flex items-start justify-between gap-3">

                      <div>
                        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                          <Tag size={13} />
                          {deal.category}
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">
                          {deal.title}
                        </h3>

                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                          {deal.description || "상세 설명이 없습니다."}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                          Number(deal.current_people) >= Number(deal.total_people)
                            ? "bg-slate-900 text-white"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {deal.status}
                      </span>
                    </div>

                    <ProgressBar
                      current={deal.current_people}
                      total={deal.total_people}
                    />

                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">

                      <div className="rounded-2xl bg-sky-50 p-3">
                        <p className="text-slate-400">1인 예상가</p>

                        <p className="mt-1 font-bold text-slate-900">
                          {formatWon(deal.price)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-sky-50 p-3">
                        <p className="text-slate-400">거래 장소</p>

                        <p className="mt-1 font-bold text-slate-900">
                          {deal.location || "미정"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                      <Clock size={15} />
                      마감일 {deal.deadline}
                    </div>

                    <div className="mt-5 flex gap-2">

                      <Button
                        onClick={() => joinDeal(deal)}
                        disabled={
                          Number(deal.current_people) >=
                            Number(deal.total_people) ||
                          joinedDeals.includes(deal.id) ||
                          deal.is_author
                        }
                        className={`flex-1 ${
                          joinedDeals.includes(deal.id)
                            ? "!bg-emerald-600"
                            : ""
                        }`}
                      >
                        {deal.is_author
                          ? "내가 만든 공구"
                          : joinedDeals.includes(deal.id)
                          ? "참여 완료"
                          : Number(deal.current_people) >=
                            Number(deal.total_people)
                          ? "구매 진행중"
                          : "참여하기"}
                      </Button>

                      <Button variant="outline">
                        <MessageCircle size={17} />
                      </Button>

                      {((deal.is_author &&
                        Number(deal.current_people) <
                          Number(deal.total_people)) ||
                        role === "admin") && (
                        <Button
                          variant="danger"
                          onClick={() => deleteDeal(deal)}
                          className="px-3"
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </section>
        )}
      </>
    )}
  </main>

  <footer className="mt-20 border-t border-sky-100 bg-white/80 px-6 py-10 text-sm text-slate-500 backdrop-blur">

    <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">

      <div>
        <h3 className="text-lg font-black text-sky-700">
          아구공
        </h3>

        <p className="mt-1">
          아주대학교 구성원을 위한 공동구매 플랫폼
        </p>

        <p className="mt-4 text-xs text-slate-400">
          © 2026 AGUGONG. All rights reserved.
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm font-semibold">

        <a
          href="이용약관 링크"
          target="_blank"
          rel="noreferrer"
          className="hover:text-sky-700"
        >
          이용약관
        </a>

        <a
          href="개인정보처리방침 링크"
          target="_blank"
          rel="noreferrer"
          className="hover:text-sky-700"
        >
          개인정보처리방침
        </a>

        <a
          href="운영정책 링크"
          target="_blank"
          rel="noreferrer"
          className="hover:text-sky-700"
        >
          운영정책
        </a>

        <a
          href="mailto:example@gmail.com"
          className="hover:text-sky-700"
        >
          문의하기
        </a>
      </div>
    </div>
  </footer>

  <CreateDealModal
    open={modalOpen}
    onClose={() => setModalOpen(false)}
    onCreate={createDeal}
  />
</div>
  );
}
