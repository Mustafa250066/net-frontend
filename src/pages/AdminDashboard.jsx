import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import { useNavigate } from "react-router-dom";
import { axiosInstance, API } from "../App";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit, LogOut, Key, Home, Eye, EyeOff, Menu, X, ChevronLeft, ChevronRight, FileText, FileCheck2, Search, Info } from "lucide-react";
import { toast } from "sonner";
import convertToDirectUrl from '../lib/convert';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [shows, setShows] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pagination State
  const [currentShowPage, setCurrentShowPage] = useState(1);
  const [currentSeasonPage, setCurrentSeasonPage] = useState(1);
  const [currentEpisodePage, setCurrentEpisodePage] = useState(1);
  const [currentMoviePage, setCurrentMoviePage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // 1. Shows Page Fix
  useEffect(() => {
    const totalPages = Math.ceil(shows.length / ITEMS_PER_PAGE) || 1;
    if (currentShowPage > totalPages) setCurrentShowPage(totalPages);
  }, [shows.length, currentShowPage]);

  // 2. Seasons Page Fix (Filtered shows ke hisaab se)
  useEffect(() => {
    const showsWithSeasons = shows.filter(show => getSeasonsByShow(show.id).length > 0);
    const totalPages = Math.ceil(showsWithSeasons.length / ITEMS_PER_PAGE) || 1;
    if (currentSeasonPage > totalPages) setCurrentSeasonPage(totalPages);
  }, [shows, seasons, currentSeasonPage]);

  // 3. Episodes Page Fix
  useEffect(() => {
    const totalPages = Math.ceil(episodes.length / ITEMS_PER_PAGE) || 1;
    if (currentEpisodePage > totalPages) setCurrentEpisodePage(totalPages);
  }, [episodes.length, currentEpisodePage]);

  // 4. Movies Page Fix
  useEffect(() => {
    const totalPages = Math.ceil(movies.length / ITEMS_PER_PAGE) || 1;
    if (currentMoviePage > totalPages) setCurrentMoviePage(totalPages);
  }, [movies.length, currentMoviePage]);

  // --- END BUG FIXES ---

  // Modals
  const [showDialog, setShowDialog] = useState(false);
  const [seasonDialog, setSeasonDialog] = useState(false);
  const [episodeDialog, setEpisodeDialog] = useState(false);
  const [movieDialog, setMovieDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkType, setBulkType] = useState(""); // "shows", "seasons", "episodes", "movies"
  const [bulkForm, setBulkForm] = useState({ show_id: "", season_id: "" });
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit states
  const [editingShow, setEditingShow] = useState(null);
  const [editingSeason, setEditingSeason] = useState(null);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [editingMovie, setEditingMovie] = useState(null);
  const [selectedSeasons, setSelectedSeasons] = useState([]);
  const [selectedEpisodes, setSelectedEpisodes] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [bulkReport, setBulkReport] = useState(null);
  const [reportDialog, setReportDialog] = useState(false);

  // Search State
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [adminSearchFilters, setAdminSearchFilters] = useState(["shows", "seasons", "episodes", "movies"]);
  const [activeTab, setActiveTab] = useState("shows");

  // Forms
  const [showForm, setShowForm] = useState({
    name: "",
    description: "",
    poster_url: "",
  });
  const [seasonForm, setSeasonForm] = useState({
    show_id: "",
    season_number: "",
    name: "",
  });
  const [episodeForm, setEpisodeForm] = useState({
    show_id: "",
    season_id: "",
    episode_number: "",
    title: "",
    description: "",
    video_url: "",
    duration: "",
    thumbnail_url: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
  });
  const [movieForm, setMovieForm] = useState({
    show_id: "",
    title: "",
    description: "",
    video_url: "",
    duration: "",
    thumbnail_url: "",
    poster_url: "",
  });

  // Global Search Filtering Logic
  const getFilteredResults = () => {
    if (!adminSearchQuery.trim()) return { filteredShows: [], filteredSeasons: [], filteredEpisodes: [], filteredMovies: [] };

    const query = adminSearchQuery.toLowerCase();
    
    // Helper to find show by name
    const matchesShowName = (showId) => {
      const show = shows.find(s => s.id === showId);
      return show && show.name.toLowerCase().includes(query);
    };

    return {
      filteredShows: adminSearchFilters.includes("shows") 
        ? shows.filter(s => s.name.toLowerCase().includes(query)) 
        : [],
      filteredSeasons: adminSearchFilters.includes("seasons")
        ? seasons.filter(s => matchesShowName(s.show_id))
        : [],
      filteredEpisodes: adminSearchFilters.includes("episodes")
        ? episodes.filter(e => matchesShowName(e.show_id) || e.title.toLowerCase().includes(query))
        : [],
      filteredMovies: adminSearchFilters.includes("movies")
        ? movies.filter(m => (m.show_id && matchesShowName(m.show_id)) || m.title.toLowerCase().includes(query))
        : []
    };
  };

  const { filteredShows, filteredSeasons, filteredEpisodes, filteredMovies } = getFilteredResults();
  const hasSearchResults = filteredShows.length > 0 || filteredSeasons.length > 0 || filteredEpisodes.length > 0 || filteredMovies.length > 0;

  const toggleSearchFilter = (filter) => {
    setAdminSearchFilters(prev => 
      prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  // Helper to get total search count
  const totalSearchCount = filteredShows.length + filteredSeasons.length + filteredEpisodes.length + filteredMovies.length;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      await axiosInstance.get("/auth/verify");
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem("adminToken");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, loginForm);
      localStorage.setItem("adminToken", response.data.access_token);
      setIsAuthenticated(true);
      toast.success("Login successful");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAuthenticated(false);
    navigate("/");
    setMobileMenuOpen(false);
  };

  const fetchAllData = async () => {
    try {
      const [showsRes, seasonsRes, episodesRes, moviesRes] = await Promise.all([
        axios.get(`${API}/shows`),
        axios.get(`${API}/seasons`),
        axios.get(`${API}/episodes`),
        axios.get(`${API}/movies`),
      ]);
      setShows(showsRes.data);
      setSeasons(seasonsRes.data);
      setEpisodes(episodesRes.data);
      setMovies(moviesRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  // Show Operations
  const handleCreateShow = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/shows", showForm);
      toast.success("Show created successfully");
      const report = {
        type: "shows",
        counts: { success: 1, duplicate: 0, error: 0 },
        items: [{ row: 1, name: showForm.name, status: "Success" }]
      };
      setBulkReport(report);
      setTimeout(() => setBulkReport(p => p === report ? null : p), 60000);
      setShowDialog(false);
      setShowForm({ name: "", description: "", poster_url: "" });
      fetchAllData();
    } catch (error) {
      const msg = error.response?.data?.detail || "Server error";
      toast.error("Failed to create show");
      const report = {
        type: "shows",
        counts: { success: 0, duplicate: 0, error: 1 },
        items: [{ row: 1, name: showForm.name || "Unknown Show", status: "Error", message: msg }]
      };
      setBulkReport(report);
      setTimeout(() => setBulkReport(p => p === report ? null : p), 60000);
    }
  };

  const handleEditShow = (show) => {
    setEditingShow(show);
    setShowForm({
      name: show.name,
      description: show.description || "",
      poster_url: show.poster_url || "",
    });
    setShowDialog(true);
  };

  const handleCloseShowDialog = () => {
    setShowDialog(false);
    setShowForm({ name: "", description: "", poster_url: "" });
    setEditingShow(null);
  };

  const handleUpdateShow = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/shows/${editingShow.id}`, showForm);
      toast.success("Show updated successfully");
      setShowDialog(false);
      setShowForm({ name: "", description: "", poster_url: "" });
      setEditingShow(null);
      fetchAllData();
    } catch (error) {
      toast.error("Failed to update show");
    }
  };

  const handleDeleteShow = async (showId) => {
    if (
      !window.confirm(
        "Are you sure? This will delete all seasons and episodes."
      )
    )
      return;
    try {
      await axiosInstance.delete(`/shows/${showId}`);
      toast.success("Show deleted successfully");
      fetchAllData();
    } catch (error) {
      toast.error("Failed to delete show");
    }
  };

  // Season Operations
  const handleCreateSeason = async (e) => {
    e.preventDefault();

    if (!seasonForm.show_id) {
      toast.error("Please select a show before creating the season.");
      return;
    }
    const seasonNumber = parseInt(seasonForm.season_number);
    if (isNaN(seasonNumber) || seasonNumber <= 0) {
      toast.error("Season number must be a positive number");
      return;
    }

    const duplicateSeason = seasons.find(
      (s) => s.show_id === seasonForm.show_id && s.season_number === seasonNumber
    );
    if (duplicateSeason) {
      toast.error(`Season ${seasonNumber} already exists for this show`);
      const report = {
        type: "seasons",
        counts: { success: 0, duplicate: 1, error: 0 },
        items: [{ row: 1, name: `Season ${seasonNumber}`, status: "Duplicate", message: "Already exists for this show" }]
      };
      setBulkReport(report);
      setTimeout(() => setBulkReport(p => p === report ? null : p), 60000);
      return;
    }

    try {
      await axiosInstance.post("/seasons", {
        ...seasonForm,
        season_number: seasonNumber,
      });
      toast.success("Season created successfully");
      const report = {
        type: "seasons",
        counts: { success: 1, duplicate: 0, error: 0 },
        items: [{ row: 1, name: `Season ${seasonNumber}`, status: "Success" }]
      };
      setBulkReport(report);
      setTimeout(() => setBulkReport(p => p === report ? null : p), 60000);
      setSeasonDialog(false);
      setSeasonForm({ show_id: "", season_number: "", name: "" });
      setEditingSeason(null);
      fetchAllData();
    } catch (error) {
      const msg = error.response?.data?.detail || "Server error";
      toast.error("Failed to create season");
      const report = {
        type: "seasons",
        counts: { success: 0, duplicate: 0, error: 1 },
        items: [{ row: 1, name: `Season ${seasonNumber}`, status: "Error", message: msg }]
      };
      setBulkReport(report);
      setTimeout(() => setBulkReport(p => p === report ? null : p), 60000);
    }
  };

  const handleCloseSeasonDialog = () => {
    setSeasonDialog(false);
    setSeasonForm({ show_id: "", season_number: "", name: "" });
    setEditingSeason(null);
  };

  const handleEditSeason = (season) => {
    setEditingSeason(season);
    setSeasonForm({
      show_id: season.show_id,
      season_number: season.season_number.toString(),
      name: season.name || "",
    });
    setSeasonDialog(true);
  };

  const handleUpdateSeason = async (e) => {
    e.preventDefault();

    if (!seasonForm.show_id) {
      toast.error("Please select a show before updating the season.");
      return;
    }
    const seasonNumber = parseInt(seasonForm.season_number);
    if (isNaN(seasonNumber) || seasonNumber <= 0) {
      toast.error("Season number must be a positive number");
      return;
    }

    const duplicateSeason = seasons.find(
      (s) =>
        s.show_id === seasonForm.show_id &&
        s.season_number === seasonNumber &&
        s.id !== editingSeason.id
    );
    if (duplicateSeason) {
      toast.error(`Season ${seasonNumber} already exists for this show`);
      return;
    }

    try {
      await axiosInstance.put(`/seasons/${editingSeason.id}`, {
        ...seasonForm,
        season_number: seasonNumber,
      });
      toast.success("Season updated successfully");
      setSeasonDialog(false);
      setSeasonForm({ show_id: "", season_number: "", name: "" });
      setEditingSeason(null);
      fetchAllData();
    } catch (error) {
      toast.error("Failed to update season");
    }
  };

  const handleDeleteSeason = async (seasonId) => {
    if (!window.confirm("Are you sure? This will delete all episodes.")) return;
    try {
      await axiosInstance.delete(`/seasons/${seasonId}`);
      toast.success("Season deleted successfully");
      fetchAllData();
    } catch (error) {
      toast.error("Failed to delete season");
    }
  };

  const handleCreateEpisode = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!episodeForm.show_id) {
      toast.error("Please select a show before saving the episode.");
      return;
    }

    if (!episodeForm.season_id) {
      toast.error("Please select a season before saving the episode.");
      return;
    }

    if (!episodeForm.episode_number) {
      toast.error("Please enter an episode number.");
      return;
    }

    if (!episodeForm.video_url) {
      toast.error("Please enter a video URL.");
      return;
    }

    const episodeNumber = parseInt(episodeForm.episode_number);
    if (isNaN(episodeNumber) || episodeNumber <= 0) {
      toast.error("Episode number must be a positive number");
      return;
    }

    const duplicateEpisode = episodes.find(
      (e) =>
        e.season_id === episodeForm.season_id &&
        e.episode_number === episodeNumber
    );
    if (duplicateEpisode) {
      toast.error(`Episode ${episodeNumber} already exists for this season`);
      const report = {
        type: "episodes",
        counts: { success: 0, duplicate: 1, error: 0 },
        items: [{ row: 1, name: episodeForm.title || `Episode ${episodeNumber}`, status: "Duplicate", message: "Already exists for this season" }]
      };
      setBulkReport(report);
      setTimeout(() => setBulkReport(p => p === report ? null : p), 60000);
      return;
    }

    try {
      const episodeData = {
        ...episodeForm,
        episode_number: episodeNumber,
        duration: episodeForm.duration ? parseInt(episodeForm.duration) : null,
      };
      await axiosInstance.post("/episodes", episodeData);
      toast.success("Episode created successfully");
      const report = {
        type: "episodes",
        counts: { success: 1, duplicate: 0, error: 0 },
        items: [{ row: 1, name: episodeForm.title || `Episode ${episodeNumber}`, status: "Success" }]
      };
      setBulkReport(report);
      setTimeout(() => setBulkReport(p => p === report ? null : p), 60000);
      setEpisodeDialog(false);
      setEpisodeForm({
        show_id: "",
        season_id: "",
        episode_number: "",
        title: "",
        description: "",
        video_url: "",
        duration: "",
        thumbnail_url: "",
      });
      setEditingEpisode(null);
      fetchAllData();
    } catch (error) {
      const msg = error.response?.data?.detail || "Server error";
      toast.error("Failed to create episode");
      const report = {
        type: "episodes",
        counts: { success: 0, duplicate: 0, error: 1 },
        items: [{ row: 1, name: episodeForm.title || `Episode ${episodeNumber}`, status: "Error", message: msg }]
      };
      setBulkReport(report);
      setTimeout(() => setBulkReport(p => p === report ? null : p), 60000);
    }
  };

  const handleCloseEpisodeDialog = () => {
    setEpisodeDialog(false);
    setEpisodeForm({
      show_id: "",
      season_id: "",
      episode_number: "",
      title: "",
      description: "",
      video_url: "",
      duration: "",
      thumbnail_url: "",
    });
    setEditingEpisode(null);
  };

  const handleEditEpisode = (episode) => {
    setEditingEpisode(episode);
    setEpisodeForm({
      show_id: episode.show_id,
      season_id: episode.season_id,
      episode_number: episode.episode_number.toString(),
      title: episode.title,
      description: episode.description || "",
      video_url: episode.video_url,
      duration: episode.duration ? episode.duration.toString() : "",
      thumbnail_url: episode.thumbnail_url || "",
    });
    setEpisodeDialog(true);
  };

  const handleUpdateEpisode = async (e) => {
    e.preventDefault();

    // Validation
    if (!episodeForm.show_id) {
      toast.error("Please select a show before updating the episode.");
      return;
    }

    if (!episodeForm.season_id) {
      toast.error("Please select a season before updating the episode.");
      return;
    }

    if (!episodeForm.episode_number) {
      toast.error("Please enter an episode number.");
      return;
    }

    if (!episodeForm.video_url) {
      toast.error("Please enter a video URL.");
      return;
    }

    const episodeNumber = parseInt(episodeForm.episode_number);
    if (isNaN(episodeNumber) || episodeNumber <= 0) {
      toast.error("Episode number must be a positive number");
      return;
    }

    const duplicateEpisode = episodes.find(
      (e) =>
        e.season_id === episodeForm.season_id &&
        e.episode_number === episodeNumber &&
        e.id !== editingEpisode.id
    );
    if (duplicateEpisode) {
      toast.error(`Episode ${episodeNumber} already exists for this season`);
      return;
    }

    try {
      const episodeData = {
        ...episodeForm,
        episode_number: episodeNumber,
        duration: episodeForm.duration ? parseInt(episodeForm.duration) : null,
      };

      await axiosInstance.put(`/episodes/${editingEpisode.id}`, episodeData);
      toast.success("Episode updated successfully");
      setEpisodeDialog(false);
      setEditingEpisode(null);
      setEpisodeForm({
        show_id: "",
        season_id: "",
        episode_number: "",
        title: "",
        description: "",
        video_url: "",
        duration: "",
        thumbnail_url: "",
      });
      fetchAllData();
    } catch (error) {
      toast.error("Failed to update episode");
    }
  };

  const handleDeleteEpisode = async (episodeId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axiosInstance.delete(`/episodes/${episodeId}`);
      toast.success("Episode deleted successfully");
      fetchAllData();
    } catch (error) {
      toast.error("Failed to delete episode");
    }
  };

  // Movie Operations
  const handleCreateMovie = async (e) => {
    e.preventDefault();
    try {
      const movieData = {
        ...movieForm,
        duration: movieForm.duration ? Number(movieForm.duration) : null,
      };
      await axiosInstance.post("/movies", movieData);
      toast.success("Movie created successfully");
      const report = {
        type: "movies",
        counts: { success: 1, duplicate: 0, error: 0 },
        items: [{ row: 1, name: movieForm.title, status: "Success" }]
      };
      setBulkReport(report);
      setTimeout(() => setBulkReport(p => p === report ? null : p), 60000);
      setMovieDialog(false);
      setMovieForm({
        show_id: "",
        title: "",
        description: "",
        video_url: "",
        duration: "",
        thumbnail_url: "",
        poster_url: "",
      });
      setEditingMovie(null);
      fetchAllData();
    } catch (error) {
      const msg = error.response?.data?.detail || "Server error";
      toast.error("Failed to create movie");
      const report = {
        type: "movies",
        counts: { success: 0, duplicate: 0, error: 1 },
        items: [{ row: 1, name: movieForm.title || "Unknown Movie", status: "Error", message: msg }]
      };
      setBulkReport(report);
      setTimeout(() => setBulkReport(p => p === report ? null : p), 60000);
    }
  };

  const handleCloseMovieDialog = () => {
    setMovieDialog(false);
    setMovieForm({
      show_id: "",
      title: "",
      description: "",
      video_url: "",
      duration: "",
      thumbnail_url: "",
      poster_url: "",
    });
    setEditingMovie(null);
  };

  const handleEditMovie = (movie) => {
    setEditingMovie(movie);
    setMovieForm({
      show_id: movie.show_id,
      title: movie.title,
      description: movie.description || "",
      video_url: movie.video_url,
      duration: movie.duration ? movie.duration.toString() : "",
      thumbnail_url: movie.thumbnail_url || "",
      poster_url: movie.poster_url || "",
    });
    setMovieDialog(true);
  };

  const handleUpdateMovie = async (e) => {
    e.preventDefault();
    try {
      const movieData = {
        ...movieForm,
        duration: movieForm.duration ? Number(movieForm.duration) : null,
      };
      await axiosInstance.put(`/movies/${editingMovie.id}`, movieData);
      toast.success("Movie updated successfully");
      setMovieDialog(false);
      setMovieForm({
        show_id: "",
        title: "",
        description: "",
        video_url: "",
        duration: "",
        thumbnail_url: "",
        poster_url: "",
      });
      setEditingMovie(null);
      fetchAllData();
    } catch (error) {
      toast.error("Failed to update movie");
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await axiosInstance.delete(`/movies/${movieId}`);
      toast.success("Movie deleted successfully");
      fetchAllData();
    } catch (error) {
      toast.error("Failed to delete movie");
    }
  };

  // Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/auth/change-password", passwordForm);
      toast.success("Password changed successfully");
      setPasswordDialog(false);
      setPasswordForm({ current_password: "", new_password: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to change password");
    }
  };

  // Bulk Delete logic
  const handleBulkDelete = async (type) => {
    let ids = [];
    if (type === "seasons") ids = selectedSeasons;
    else if (type === "episodes") ids = selectedEpisodes;
    else if (type === "movies") ids = selectedMovies;

    if (ids.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${ids.length} ${type}?`)) return;

    setLoading(true);
    let success = 0;
    let fail = 0;

    for (const id of ids) {
      try {
        await axiosInstance.delete(`/${type}/${id}`);
        success++;
      } catch (err) {
        console.error(`Failed to delete ${type} with id ${id}:`, err);
        fail++;
      }
    }

    toast.success(`Bulk delete finished. Success: ${success}, Failed: ${fail}`);
    
    // Clear selection
    if (type === "seasons") setSelectedSeasons([]);
    else if (type === "episodes") setSelectedEpisodes([]);
    else if (type === "movies") setSelectedMovies([]);

    fetchAllData();
    setLoading(false);
  };

  // ------------------------------------------
  // BUG FIX 1: getCellValue Updated Logic
  // This handles trailing/leading spaces from Excel center formatting
  // ------------------------------------------
  const getCellValue = (item, keys) => {
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) {
        return String(item[key]).trim();
      }
      const foundKey = Object.keys(item).find(
        (k) => k.trim().toLowerCase() === key.toLowerCase()
      );
      if (foundKey && item[foundKey] !== undefined && item[foundKey] !== null) {
        return String(item[foundKey]).trim();
      }
    }
    return "";
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      toast.error("Please select an Excel file");
      return;
    }

    // Validation for dropdowns
    if (bulkType === "seasons") {
      if (!bulkForm.show_id) {
        toast.error("Please select a show for bulk upload");
        return;
      }
    } else if (bulkType === "episodes") {
      if (!bulkForm.show_id) {
        toast.error("Please select a show first");
        return;
      }
      if (!bulkForm.season_id) {
        toast.error("Please select a season for bulk upload");
        return;
      }
    }

    setBulkLoading(true);
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast.error("Excel file is empty");
          setBulkLoading(false);
          return;
        }

        const reportItems = [];
        let sCount = 0;
        let dCount = 0;
        let eCount = 0;

        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          const rowNum = i + 2; 
          let itemName = getCellValue(item, ['name', 'title', 'show name', 'show_name']) || `Row ${rowNum}`;
          
          try {
            if (bulkType === "shows") {
              const showData = {
                name: getCellValue(item, ['name', 'title', 'show name', 'show_name']),
                description: getCellValue(item, ['description', 'summary', 'desc']),
                poster_url: getCellValue(item, ['poster_url', 'poster', 'image', 'url']),
              };
              if (!showData.name) {
                reportItems.push({ row: rowNum, name: "Unknown", status: "Error", message: "Show name is missing" });
                eCount++;
                continue;
              }
              await axiosInstance.post("/shows", showData);
              reportItems.push({ row: rowNum, name: showData.name, status: "Success" });
              sCount++;
            } else if (bulkType === "seasons") {
              const seasonNumberStr = getCellValue(item, ['season_number', 'season', 'number']);
              const seasonNumber = parseInt(seasonNumberStr);
              if (isNaN(seasonNumber)) {
                reportItems.push({ row: rowNum, name: itemName, status: "Error", message: "Invalid season number" });
                eCount++;
                continue;
              }

              const duplicate = seasons.find(s => s.show_id === bulkForm.show_id && s.season_number === seasonNumber);
              if (duplicate) {
                reportItems.push({ row: rowNum, name: `Season ${seasonNumber}`, status: "Duplicate", message: "Already exists for this show" });
                dCount++;
                continue;
              }

              await axiosInstance.post("/seasons", {
                show_id: bulkForm.show_id,
                season_number: seasonNumber,
                name: getCellValue(item, ['name', 'title']),
              });
              reportItems.push({ row: rowNum, name: `Season ${seasonNumber}`, status: "Success" });
              sCount++;
            } else if (bulkType === "episodes") {
              const epNumberStr = getCellValue(item, ['episode_number', 'episode', 'number']);
              const epNumber = parseInt(epNumberStr);
              const videoUrl = getCellValue(item, ['video_url', 'url', 'video', 'link']);
              const title = getCellValue(item, ['title', 'name']) || `Episode ${epNumber}`;
              
              if (isNaN(epNumber)) {
                reportItems.push({ row: rowNum, name: "Unknown", status: "Error", message: "Invalid episode number" });
                eCount++;
                continue;
              }
              if (!videoUrl) {
                reportItems.push({ row: rowNum, name: title, status: "Error", message: "Video URL is missing" });
                eCount++;
                continue;
              }

              const duplicate = episodes.find(e => e.season_id === bulkForm.season_id && e.episode_number === epNumber);
              if (duplicate) {
                reportItems.push({ row: rowNum, name: title, status: "Duplicate", message: "Already exists in this season" });
                dCount++;
                continue;
              }

              await axiosInstance.post("/episodes", {
                show_id: bulkForm.show_id,
                season_id: bulkForm.season_id,
                episode_number: epNumber,
                title: title,
                description: getCellValue(item, ['description', 'summary', 'desc']),
                video_url: videoUrl,
                duration: parseInt(getCellValue(item, ['duration', 'time', 'length'])) || null,
                thumbnail_url: getCellValue(item, ['thumbnail_url', 'thumbnail', 'thumb']),
              });
              reportItems.push({ row: rowNum, name: title, status: "Success" });
              sCount++;
            } else if (bulkType === "movies") {
              const title = getCellValue(item, ['title', 'name']);
              const videoUrl = getCellValue(item, ['video_url', 'url', 'video', 'link']);
              
              if (!title) {
                reportItems.push({ row: rowNum, name: "Unknown", status: "Error", message: "Movie title is missing" });
                eCount++;
                continue;
              }
              if (!videoUrl) {
                reportItems.push({ row: rowNum, name: title, status: "Error", message: "Video URL is missing" });
                eCount++;
                continue;
              }

              await axiosInstance.post("/movies", {
                show_id: bulkForm.show_id === "none" ? "" : bulkForm.show_id,
                title: title,
                description: getCellValue(item, ['description', 'summary', 'desc']),
                video_url: videoUrl,
                duration: parseInt(getCellValue(item, ['duration', 'time', 'length'])) || null,
                thumbnail_url: getCellValue(item, ['thumbnail_url', 'thumbnail', 'thumb']),
                poster_url: getCellValue(item, ['poster_url', 'poster', 'image']),
              });
              reportItems.push({ row: rowNum, name: title, status: "Success" });
              sCount++;
            }
          } catch (err) {
            const errorMsg = err.response?.data?.detail || "Server error";
            reportItems.push({ row: rowNum, name: itemName, status: "Error", message: errorMsg });
            eCount++;
          }
          setUploadProgress(Math.round(((i + 1) / data.length) * 100));
        }

        // Store report and set clear timer
        const currentReport = {
          type: bulkType,
          items: reportItems,
          counts: { success: sCount, duplicate: dCount, error: eCount }
        };
        setBulkReport(currentReport);
        
        // Clear after 1 min (60,000ms)
        setTimeout(() => {
          setBulkReport(prev => (prev === currentReport ? null : prev));
        }, 60000);

        toast.success(`${sCount} saved, ${dCount} duplicates, ${eCount} errors. Click 'View Report' for details.`);
        
        setTimeout(() => {
          handleCloseBulkDialog();
          fetchAllData();
        }, 500);
      } catch (error) {
        toast.error("Failed to parse Excel file");
      } finally {
        setBulkLoading(false);
      }
    };
    reader.readAsBinaryString(bulkFile);
  };

  const handleCloseBulkDialog = () => {
    setBulkDialog(false);
    setBulkType("");
    setBulkForm({ show_id: "", season_id: "" });
    setBulkFile(null);
    setBulkLoading(false);
    setUploadProgress(0);
  };

  const handleOpenBulkDialog = (type) => {
    setBulkType(type);
    setBulkDialog(true);
    setUploadProgress(0);
  };

  // Filter seasons by show
  const getSeasonsByShow = (showId) => {
    return seasons.filter((s) => s.show_id === showId);
  };

  // Helper function to truncate text
  const truncateText = (text, maxLength = 50) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Helper to render pagination items
  const renderPaginationItems = (currentPage, totalPages, setPage) => {
    const items = [];
    const maxVisible = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => {
              setPage(i);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isActive={currentPage === i}
            className="cursor-pointer hover:bg-[#e50914] hover:text-white transition-colors border-gray-700"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-[#0a0a0a] to-[#1a1a1a] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#e50914] mb-2"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              Admin Login
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">Enter your credentials to continue</p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-[#1a1a1a] p-6 sm:p-8 rounded-lg border border-gray-800"
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  data-testid="login-username"
                  id="username"
                  type="text"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  required
                  className="mt-1"
                  placeholder="Admin username"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    data-testid="login-password"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm({ ...loginForm, password: e.target.value })
                    }
                    required
                    className="mt-1 pr-10"
                    placeholder="Admin password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent group"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff
                        className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors"
                        aria-hidden="true"
                      />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button
              data-testid="login-submit-btn"
              type="submit"
              className="w-full mt-6 bg-[#e50914] hover:bg-[#f40612]"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Button
              data-testid="back-home-btn"
              type="button"
              onClick={() => navigate("/")}
              variant="ghost"
              className="w-full mt-2"
            >
              Back to Home
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold text-[#e50914] truncate">
              Admin Dashboard
            </h1>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-2">
              <Button
                data-testid="home-btn"
                onClick={() => navigate("/")}
                variant="outline"
                className="border-gray-700"
                size="sm"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button
                data-testid="change-password-btn"
                onClick={() => setPasswordDialog(true)}
                variant="outline"
                className="border-gray-700"
                size="sm"
              >
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              <Button
                data-testid="logout-btn"
                onClick={handleLogout}
                variant="outline"
                className="border-[#e50914] text-[#e50914] hover:text-white hover:bg-[#e50914]"
                size="sm"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5 text-gray-400" />
              ) : (
                <Menu className="h-5 w-5 text-gray-400" />
              )}
            </Button>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 pt-3 border-t border-gray-800 space-y-2 animate-in slide-in-from-top-2 duration-200">
              <Button
                data-testid="home-btn-mobile"
                onClick={() => {
                  navigate("/");
                  setMobileMenuOpen(false);
                }}
                variant="outline"
                className="w-full justify-start border-gray-700"
                size="sm"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button
                data-testid="change-password-btn-mobile"
                onClick={() => {
                  setPasswordDialog(true);
                  setMobileMenuOpen(false);
                }}
                variant="outline"
                className="w-full justify-start border-gray-700"
                size="sm"
              >
                <Key className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              <Button
                data-testid="logout-btn-mobile"
                onClick={handleLogout}
                variant="outline"
                className="w-full justify-start border-red-500 text-red-500 hover:text-white hover:bg-red-500"
                size="sm"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        {/* Global Dialogs */}
        <Dialog
          open={showDialog}
          onOpenChange={(open) => {
            if (!open) handleCloseShowDialog();
            else setShowDialog(true);
          }}
        >
          <DialogContent className="bg-[#1a1a1a] border-gray-800 w-[95vw] sm:max-w-lg mx-auto rounded-lg overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingShow ? "Edit Show" : "Add New Show"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={editingShow ? handleUpdateShow : handleCreateShow}
              className="space-y-4 max-w-full overflow-hidden"
            >
              <div>
                <Label>Show Name *</Label>
                <Input
                  data-testid="show-name-input"
                  value={showForm.name}
                  onChange={(e) =>
                    setShowForm({ ...showForm, name: e.target.value })
                  }
                  required
                  placeholder="E.g. Stranger Things"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  data-testid="show-description-input"
                  value={showForm.description}
                  onChange={(e) =>
                    setShowForm({
                      ...showForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Brief description of the show..."
                />
              </div>
              <div>
                <Label>Poster URL</Label>
                <Input
                  data-testid="show-poster-input"
                  value={showForm.poster_url}
                  onChange={(e) =>
                    setShowForm({
                      ...showForm,
                      poster_url: e.target.value,
                    })
                  }
                  placeholder="https://example.com/poster.jpg"
                />
              </div>
              <Button
                data-testid="create-show-btn"
                type="submit"
                className="w-full bg-[#e50914] hover:bg-[#f40612]"
              >
                {editingShow ? "Update Show" : "Create Show"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={seasonDialog}
          onOpenChange={(open) => {
            if (!open) handleCloseSeasonDialog();
            else setSeasonDialog(true);
          }}
        >
          <DialogContent className="bg-[#1a1a1a] border-gray-800 w-[95vw] sm:max-w-lg mx-auto rounded-lg overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingSeason ? "Edit Season" : "Add New Season"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={
                editingSeason ? handleUpdateSeason : handleCreateSeason
              }
              className="space-y-4 max-w-full overflow-hidden"
            >
              <div>
                <Label>Select Show *</Label>
                <Select
                  value={seasonForm.show_id}
                  onValueChange={(value) =>
                    setSeasonForm({ ...seasonForm, show_id: value })
                  }
                  required
                >
                  <SelectTrigger data-testid="season-show-select" className="w-full">
                    <div className="truncate text-left w-full">
                      <SelectValue placeholder="Select a show" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {shows.map((show) => (
                      <SelectItem key={show.id} value={show.id} className="truncate" title={show.name}>
                        {truncateText(show.name, 40)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Season Number *</Label>
                <Input
                  data-testid="season-number-input"
                  type="number"
                  value={seasonForm.season_number}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 12) {
                      setSeasonForm({
                        ...seasonForm,
                        season_number: value,
                      });
                    }
                  }}
                  required
                  placeholder="1, 2, 3..."
                />
              </div>
              <div>
                <Label>Season Name (Optional)</Label>
                <Input
                  data-testid="season-name-input"
                  value={seasonForm.name}
                  onChange={(e) =>
                    setSeasonForm({ ...seasonForm, name: e.target.value })
                  }
                  placeholder="E.g. Season 1: The Beginning"
                />
              </div>
              <Button
                data-testid="create-season-btn"
                type="submit"
                className="w-full bg-[#e50914] hover:bg-[#f40612]"
              >
                {editingSeason ? "Update Season" : "Create Season"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={episodeDialog}
          onOpenChange={(open) => {
            if (!open) handleCloseEpisodeDialog();
            else setEpisodeDialog(true);
          }}
        >
          <DialogContent className="bg-[#1a1a1a] border-gray-800 w-[95vw] sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto rounded-lg overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingEpisode ? "Edit Episode" : "Add New Episode"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={
                editingEpisode ? handleUpdateEpisode : handleCreateEpisode
              }
              className="space-y-4 max-w-full overflow-hidden"
            >
              <div>
                <Label>Select Show *</Label>
                <Select
                  value={episodeForm.show_id}
                  onValueChange={(value) =>
                    setEpisodeForm({
                      ...episodeForm,
                      show_id: value,
                      season_id: "",
                    })
                  }
                  required
                >
                  <SelectTrigger data-testid="episode-show-select" className="w-full">
                    <div className="truncate text-left w-full">
                      <SelectValue placeholder="Select a show" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {shows.map((show) => (
                      <SelectItem key={show.id} value={show.id} className="truncate" title={show.name}>
                        {truncateText(show.name, 40)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Select Season *</Label>
                <Select
                  value={episodeForm.season_id}
                  onValueChange={(value) =>
                    setEpisodeForm({ ...episodeForm, season_id: value })
                  }
                  required
                  disabled={!episodeForm.show_id}
                >
                  <SelectTrigger data-testid="episode-season-select" className="w-full">
                    <div className="truncate text-left w-full">
                      <SelectValue placeholder="Select a season" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {getSeasonsByShow(episodeForm.show_id).map(
                      (season) => (
                        <SelectItem key={season.id} value={season.id} className="truncate" title={`Season ${season.season_number}${season.name ? ` - ${season.name}` : ''}`}>
                          Season {season.season_number}
                          {season.name && ` - ${truncateText(season.name, 30)}`}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Episode Number *</Label>
                <Input
                  data-testid="episode-number-input"
                  type="number"
                  value={episodeForm.episode_number}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 12) {
                      setEpisodeForm({
                        ...episodeForm,
                        episode_number: value,
                      });
                    }
                  }}
                  required
                  placeholder="1, 2, 3..."
                />
              </div>
              <div>
                <Label>Episode Title (Optional)</Label>
                <Input
                  data-testid="episode-title-input"
                  value={episodeForm.title}
                  onChange={(e) =>
                    setEpisodeForm({
                      ...episodeForm,
                      title: e.target.value,
                    })
                  }
                  placeholder="E.g. Chapter One: The Vanishing of Will Byers"
                />
              </div>
              <div>
                <Label>Video URL *</Label>
                <Input
                  data-testid="episode-video-url-input"
                  value={episodeForm.video_url}
                  onChange={(e) =>
                    setEpisodeForm({
                      ...episodeForm,
                      video_url: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  data-testid="episode-description-input"
                  value={episodeForm.description}
                  onChange={(e) =>
                    setEpisodeForm({
                      ...episodeForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Episode summary..."
                />
              </div>
              <div>
                <Label>Duration (in minutes)</Label>
                <Input
                  data-testid="episode-duration-input"
                  type="number"
                  value={episodeForm.duration}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 12) {
                      setEpisodeForm({
                        ...episodeForm,
                        duration: value,
                      });
                    }
                  }}
                  placeholder="45"
                />
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  data-testid="episode-thumbnail-input"
                  value={episodeForm.thumbnail_url}
                  onChange={(e) =>
                    setEpisodeForm({
                      ...episodeForm,
                      thumbnail_url: e.target.value,
                    })
                  }
                  placeholder="https://..."
                />
              </div>
              <Button
                data-testid="create-episode-btn"
                type="submit"
                className="w-full bg-[#e50914] hover:bg-[#f40612]"
              >
                {editingEpisode ? "Update Episode" : "Create Episode"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={movieDialog}
          onOpenChange={(open) => {
            if (!open) handleCloseMovieDialog();
            else setMovieDialog(true);
          }}
        >
          <DialogContent className="bg-[#1a1a1a] border-gray-800 w-[95vw] sm:max-w-2xl mx-auto max-h-[90vh] overflow-y-auto rounded-lg overflow-x-hidden">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingMovie ? "Edit Movie" : "Add New Movie"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={
                editingMovie ? handleUpdateMovie : handleCreateMovie
              }
              className="space-y-4 max-w-full overflow-hidden"
            >
              <div>
                <Label>Select Show</Label>
                <Select
                  value={movieForm.show_id || "none"}
                  onValueChange={(value) =>
                    setMovieForm({
                      ...movieForm,
                      show_id: value === "none" ? "" : value,
                    })
                  }
                >
                  <SelectTrigger data-testid="movie-show-select" className="w-full">
                    <div className="truncate text-left w-full">
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Standalone Movie</SelectItem>
                    {shows.map((show) => (
                      <SelectItem key={show.id} value={show.id} className="truncate" title={show.name}>
                        {truncateText(show.name, 40)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Movie Title *</Label>
                <Input
                  data-testid="movie-title-input"
                  value={movieForm.title}
                  onChange={(e) =>
                    setMovieForm({ ...movieForm, title: e.target.value })
                  }
                  required
                  placeholder="E.g. Extraction"
                />
              </div>
              <div>
                <Label>Video URL *</Label>
                <Input
                  data-testid="movie-video-url-input"
                  value={movieForm.video_url}
                  onChange={(e) =>
                    setMovieForm({
                      ...movieForm,
                      video_url: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  data-testid="movie-description-input"
                  value={movieForm.description}
                  onChange={(e) =>
                    setMovieForm({
                      ...movieForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Movie summary..."
                />
              </div>
              <div>
                <Label>Duration (in minutes)</Label>
                <Input
                  data-testid="movie-duration-input"
                  type="number"
                  value={movieForm.duration}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 12) {
                      setMovieForm({ ...movieForm, duration: value });
                    }
                  }}
                  placeholder="120"
                />
              </div>
              <div>
                <Label>Thumbnail URL</Label>
                <Input
                  data-testid="movie-thumbnail-input"
                  value={movieForm.thumbnail_url}
                  onChange={(e) =>
                    setMovieForm({
                      ...movieForm,
                      thumbnail_url: e.target.value,
                    })
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Poster URL</Label>
                <Input
                  data-testid="movie-poster-input"
                  value={movieForm.poster_url}
                  onChange={(e) =>
                    setMovieForm({
                      ...movieForm,
                      poster_url: e.target.value,
                    })
                  }
                  placeholder="https://..."
                />
              </div>
              <Button
                data-testid="create-movie-btn"
                type="submit"
                className="w-full bg-[#e50914] hover:bg-[#f40612]"
              >
                {editingMovie ? "Update Movie" : "Create Movie"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bulk Upload Dialog */}
        <Dialog open={bulkDialog} onOpenChange={(open) => !open && handleCloseBulkDialog()}>
          <DialogContent className="bg-[#1a1a1a] border-gray-800 w-[95vw] sm:max-w-lg mx-auto rounded-lg shadow-2xl overflow-hidden">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-[#e50914] capitalize">
                Bulk Upload {bulkType}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBulkUpload} className="space-y-6 max-w-full overflow-hidden">
              {bulkType === "seasons" && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Select Show *</Label>
                  <Select
                    value={bulkForm.show_id}
                    onValueChange={(value) => setBulkForm({ ...bulkForm, show_id: value })}
                    required
                  >
                    <SelectTrigger className="w-full overflow-hidden">
                      <div className="truncate text-left w-full">
                        <SelectValue placeholder="Select a show" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {shows.map((show) => (
                        <SelectItem key={show.id} value={show.id} className="truncate" title={show.name}>
                          {truncateText(show.name, 40)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {bulkType === "episodes" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Select Show *</Label>
                    <Select
                      value={bulkForm.show_id}
                      onValueChange={(value) => setBulkForm({ ...bulkForm, show_id: value, season_id: "" })}
                      required
                    >
                      <SelectTrigger className="w-full overflow-hidden">
                        <div className="truncate text-left w-full">
                          <SelectValue placeholder="Select a show" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {shows.map((show) => (
                          <SelectItem key={show.id} value={show.id} className="truncate" title={show.name}>
                            {truncateText(show.name, 40)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Select Season *</Label>
                    <Select
                      value={bulkForm.season_id}
                      onValueChange={(value) => setBulkForm({ ...bulkForm, season_id: value })}
                      required
                      disabled={!bulkForm.show_id}
                    >
                      <SelectTrigger className="w-full disabled:opacity-50 overflow-hidden">
                        <div className="truncate text-left w-full">
                          <SelectValue placeholder="Select a season" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {getSeasonsByShow(bulkForm.show_id).map((season) => (
                          <SelectItem key={season.id} value={season.id} className="truncate" title={`Season ${season.season_number}${season.name ? ` - ${season.name}` : ''}`}>
                            Season {season.season_number} {season.name && `- ${truncateText(season.name, 30)}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {bulkType === "movies" && (
                <div className="space-y-2">
                  <Label className="text-gray-300">Select Show (Optional)</Label>
                  <Select
                    value={bulkForm.show_id || "none"}
                    onValueChange={(value) => setBulkForm({ ...bulkForm, show_id: value === "none" ? "" : value })}
                  >
                    <SelectTrigger className="w-full overflow-hidden">
                      <div className="truncate text-left w-full">
                        <SelectValue placeholder="Select a show or Single Movie" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Standalone Movie</SelectItem>
                      {shows.map((show) => (
                        <SelectItem key={show.id} value={show.id} className="truncate" title={show.name}>
                          {truncateText(show.name, 40)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <Label className="text-gray-300">Select Excel File *</Label>
                  {bulkLoading && <span className="text-xs font-medium text-[#e50914] animate-pulse">{uploadProgress}% Complete</span>}
                </div>
                <Input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setBulkFile(e.target.files[0])}
                  required
                  disabled={bulkLoading}
                  className="mt-1 h-auto p-1.5 bg-[#2a2a2a] border-gray-700 text-gray-300 file:bg-[#3d3d3d] file:text-white file:border-0 file:rounded-md file:px-4 file:py-1.5 file:mr-4 file:cursor-pointer hover:file:bg-[#4d4d4d] transition-all disabled:opacity-50"
                />

                {bulkLoading && (
                  <div className="space-y-2 pt-2">
                    <Progress value={uploadProgress} className="h-2 bg-gray-800" />
                  </div>
                )}

                <div className="bg-[#2a2a2a]/50 p-4 rounded-md border border-gray-800 mt-2">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Required Columns (Flexible Matching):</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {bulkType === "shows" && (
                      <>
                        <div className="text-[11px] text-gray-400 text-left">• name / title</div>
                        <div className="text-[11px] text-gray-400 text-left">• description</div>
                        <div className="text-[11px] text-gray-400 text-left col-span-2">• poster_url</div>
                      </>
                    )}
                    {bulkType === "seasons" && (
                      <>
                        <div className="text-[11px] text-gray-400 text-left">• season_number</div>
                        <div className="text-[11px] text-gray-400 text-left">• name / title</div>
                      </>
                    )}
                    {bulkType === "episodes" && (
                      <>
                        <div className="text-[11px] text-gray-400 text-left">• episode_number</div>
                        <div className="text-[11px] text-gray-400 text-left">• title / name</div>
                        <div className="text-[11px] text-gray-400 text-left">• video_url</div>
                        <div className="text-[11px] text-gray-400 text-left">• duration</div>
                      </>
                    )}
                    {bulkType === "movies" && (
                      <>
                        <div className="text-[11px] text-gray-400 text-left">• title / name</div>
                        <div className="text-[11px] text-gray-400 text-left">• video_url</div>
                        <div className="text-[11px] text-gray-400 text-left">• poster_url</div>
                        <div className="text-[11px] text-gray-400 text-left">• duration</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-[#e50914] hover:bg-[#b00710] text-white font-bold h-12 rounded-md shadow-lg transition-all active:scale-[0.98]"
                disabled={bulkLoading}
              >
                {bulkLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  "Upload & Save"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Bulk Report Dialog */}
        <Dialog open={reportDialog} onOpenChange={setReportDialog}>
          <DialogContent className="bg-[#1a1a1a] text-white border-gray-800 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-lg shadow-2xl">
            <DialogHeader className="pb-4 border-b border-gray-800">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                <FileCheck2 className="h-5 w-5 text-green-500" />
                Bulk Upload Report - {bulkReport?.type?.toUpperCase()}
              </DialogTitle>
              <DialogDescription className="text-gray-400 mt-1">
                Summary: <span className="text-green-500 font-semibold">{bulkReport?.counts.success} Saved</span>, 
                <span className="text-yellow-500 font-semibold mx-2">{bulkReport?.counts.duplicate} Duplicates</span>, 
                <span className="text-red-500 font-semibold">{bulkReport?.counts.error} Errors</span>
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto mt-4 border border-gray-800 rounded-md">
              <table className="w-full text-sm text-left">
                <thead className="bg-black text-gray-400 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-medium w-16 text-center border-b border-gray-800">Row</th>
                    <th className="px-4 py-3 font-medium border-b border-gray-800">Item Name</th>
                    <th className="px-4 py-3 font-medium w-24 text-center border-b border-gray-800">Status</th>
                    <th className="px-4 py-3 font-medium border-b border-gray-800">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {bulkReport?.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono text-center">{item.row}</td>
                      <td className="px-4 py-3 font-medium truncate max-w-[200px]" title={item.name}>{item.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.status === "Success" ? "bg-green-500/20 text-green-500" :
                          item.status === "Duplicate" ? "bg-yellow-500/20 text-yellow-500" :
                          "bg-red-500/20 text-red-500"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-xs ${item.status === 'Error' ? 'text-red-400' : 'text-gray-400'}`}>
                        {item.message || "-"}
                      </td>
                    </tr>
                  ))}
                  {(!bulkReport || bulkReport.items.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500 italic">
                        No data available in this report.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setReportDialog(false)} 
                className="bg-[#e50914] hover:bg-[#b00710] text-white px-8 font-semibold shadow-lg transition-all active:scale-95"
              >
                Close Report
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
          <DialogContent className="bg-[#1a1a1a] border-gray-800 w-[95vw] max-w-md mx-auto rounded-lg shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Change Password</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    data-testid="current-password-input"
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        current_password: e.target.value,
                      })
                    }
                    required
                    className="pr-10"
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent group"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff
                        className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors"
                        aria-hidden="true"
                      />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    data-testid="new-password-input"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        new_password: e.target.value,
                      })
                    }
                    required
                    className="pr-10"
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent group"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                  >
                    {showNewPassword ? (
                      <EyeOff
                        className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors"
                        aria-hidden="true"
                      />
                    )}
                  </Button>
                </div>
              </div>
              <Button
                data-testid="change-password-submit-btn"
                type="submit"
                className="w-full bg-[#e50914] hover:bg-[#f40612]"
              >
                Change Password
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Sticky Search and Tabs Container */}
          <div className="sticky top-[52px] sm:top-[64px] z-40 bg-black/95 backdrop-blur-sm -mx-3 sm:-mx-4 md:-mx-6 lg:-mx-8 px-3 sm:px-4 md:px-6 lg:px-8 py-4 border-b border-gray-800">
          {/* Search and Filters Section */}
          <div className="mb-4 bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-[#e50914] transition-colors" />
                <Input
                  placeholder="Search across all categories by show name..."
                  className="pl-10 bg-black border-gray-700 focus:border-[#e50914] h-10 text-sm sm:text-base placeholder:text-gray-600"
                  value={adminSearchQuery}
                  onChange={(e) => {
                    setAdminSearchQuery(e.target.value);
                    if (e.target.value) setActiveTab("search");
                    else setActiveTab("shows");
                  }}
                />
                {adminSearchQuery && (
                  <button 
                    onClick={() => {
                      setAdminSearchQuery("");
                      setActiveTab("shows");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-hide">
                <div className="flex gap-2 bg-black border border-gray-800 p-2 rounded-md">
                  {["shows", "seasons", "episodes", "movies"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => toggleSearchFilter(filter)}
                      className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                        adminSearchFilters.includes(filter)
                          ? "bg-[#e50914] text-white"
                          : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdminSearchFilters(["shows", "seasons", "episodes", "movies"])}
                  className="text-xs text-gray-400 hover:text-black h-9"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Responsive Tabs List */}
          <div className="overflow-x-auto pb-0 -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
            <TabsList className="bg-[#1a1a1a] border border-gray-800 w-full sm:w-auto min-w-max">
              <TabsTrigger 
                value="shows" 
                className="hover:bg-[#3d3d3d] flex-1 sm:flex-none text-sm sm:text-base px-3 sm:px-4"
              >
                Shows
              </TabsTrigger>
              <TabsTrigger 
                value="seasons" 
                className="hover:bg-[#3d3d3d] flex-1 sm:flex-none text-sm sm:text-base px-3 sm:px-4"
              >
                Seasons
              </TabsTrigger>
              <TabsTrigger 
                value="episodes" 
                className="hover:bg-[#3d3d3d] flex-1 sm:flex-none text-sm sm:text-base px-3 sm:px-4"
              >
                Episodes
              </TabsTrigger>
              <TabsTrigger 
                value="movies" 
                className="hover:bg-[#3d3d3d] flex-1 sm:flex-none text-sm sm:text-base px-3 sm:px-4"
              >
                Movies
              </TabsTrigger>
              {adminSearchQuery && (
                <TabsTrigger 
                  value="search" 
                  className="hover:bg-[#3d3d3d] flex-1 sm:flex-none text-sm sm:text-base px-3 sm:px-4 flex items-center gap-2 text-[#e50914] font-bold"
                >
                  <Search className="h-4 w-4" />
                  Results ({totalSearchCount})
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </div>

          {/* Search Results Tab Content */}
          <TabsContent value="search" className="mt-4 sm:mt-6 animate-in fade-in duration-300">
            {!hasSearchResults ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-[#1a1a1a] rounded-lg border border-dashed border-gray-800">
                <Search className="h-10 w-10 text-gray-700 mb-4" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-400">No matches found</h3>
                <p className="text-gray-600 mt-2 text-sm sm:text-base">Try a different show name or adjust your filters.</p>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Shows Results */}
                {filteredShows.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                       <h2 className="text-lg sm:text-xl font-bold text-[#e50914]">Matched Shows ({filteredShows.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {filteredShows.map((show) => {
                        const hasPoster = show.poster_url && show.poster_url.trim() !== "";
                        return (
                          <div key={show.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 sm:p-4 hover:border-gray-700 transition-colors">
                            {hasPoster ? (
                              <img
                                src={convertToDirectUrl(show.poster_url)}
                                alt={show.name}
                                className="w-full h-40 sm:h-48 object-cover rounded-lg mb-3"
                              />
                            ) : (
                              <div className="w-full h-40 sm:h-48 bg-gray-800 rounded-lg mb-3 flex items-center justify-center">
                                <Search className="h-8 w-8 text-gray-600" />
                              </div>
                            )}
                            <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-1 break-words">{show.name}</h3>
                            {show.description && <p className="text-xs sm:text-sm text-gray-400 mb-3 line-clamp-2 break-words">{show.description}</p>}
                            <div className="flex gap-2">
                              <Button onClick={() => handleEditShow(show)} variant="outline" size="sm" className="flex-1 text-xs">Edit</Button>
                              <Button onClick={() => handleDeleteShow(show.id)} variant="destructive" size="sm" className="flex-1 text-xs">Delete</Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Seasons Results */}
                {filteredSeasons.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                       <div className="flex items-center gap-3">
                         <h2 className="text-lg sm:text-xl font-bold text-[#e50914]">Matched Seasons ({filteredSeasons.length})</h2>
                         {selectedSeasons.filter(id => filteredSeasons.some(fs => fs.id === id)).length > 0 && (
                            <Button
                              onClick={() => handleBulkDelete("seasons")}
                              variant="destructive"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 h-8 text-[10px] sm:text-xs px-3"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Selected ({selectedSeasons.filter(id => filteredSeasons.some(fs => fs.id === id)).length})
                            </Button>
                         )}
                       </div>
                    </div>
                    <div className="space-y-4">
                      {shows
                        .filter(show => filteredSeasons.some(s => s.show_id === show.id))
                        .map((show) => {
                          const showSeasons = filteredSeasons.filter(s => s.show_id === show.id);
                          return (
                            <div key={show.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 sm:p-4 overflow-hidden">
                              <h3 className="text-lg font-semibold mb-3 border-l-2 border-[#e50914] pl-3 break-words line-clamp-1">{truncateText(show.name, 100)}</h3>
                              <div className="space-y-2">
                                {showSeasons.map((season) => (
                                  <div key={season.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-3 border border-gray-800 rounded-lg group hover:bg-black/40 transition-all">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <input
                                        type="checkbox"
                                        className={`h-4 w-4 rounded border-gray-700 bg-black text-[#e50914] focus:ring-[#e50914] cursor-pointer shrink-0 transition-opacity ${selectedSeasons.includes(season.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                        checked={selectedSeasons.includes(season.id)}
                                        onChange={() => {
                                          if (selectedSeasons.includes(season.id)) {
                                            setSelectedSeasons(selectedSeasons.filter(id => id !== season.id));
                                          } else {
                                            setSelectedSeasons([...selectedSeasons, season.id]);
                                          }
                                        }}
                                      />
                                      <span className="text-sm sm:text-base truncate">
                                        Season {season.season_number} {season.name && `- ${season.name}`}
                                      </span>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0 justify-end">
                                      <Button onClick={() => handleEditSeason(season)} size="sm" variant="outline" className="h-8 px-3"><Edit className="h-3.5 w-3.5" /></Button>
                                      <Button onClick={() => handleDeleteSeason(season.id)} size="sm" variant="destructive" className="h-8 px-3"><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Episodes Results */}
                {filteredEpisodes.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                       <div className="flex items-center gap-3">
                         <h2 className="text-lg sm:text-xl font-bold text-[#e50914]">Matched Episodes ({filteredEpisodes.length})</h2>
                         {selectedEpisodes.filter(id => filteredEpisodes.some(fe => fe.id === id)).length > 0 && (
                            <Button
                              onClick={() => handleBulkDelete("episodes")}
                              variant="destructive"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 h-8 text-[10px] sm:text-xs px-3"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Selected ({selectedEpisodes.filter(id => filteredEpisodes.some(fe => fe.id === id)).length})
                            </Button>
                         )}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 gap-6">
                      {shows
                        .filter(show => filteredEpisodes.some(e => e.show_id === show.id))
                        .map(show => {
                          const showMatchedSeasons = seasons.filter(s => 
                            s.show_id === show.id && 
                            filteredEpisodes.some(e => e.season_id === s.id)
                          );

                          return showMatchedSeasons.map(season => {
                            const groupEpisodes = filteredEpisodes.filter(e => 
                              e.show_id === show.id && 
                              e.season_id === season.id
                            );
                            const groupEpisodeIds = groupEpisodes.map(e => e.id);
                            const isAllSelected = groupEpisodeIds.every(id => selectedEpisodes.includes(id));

                            return (
                              <div key={season.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden shadow-sm">
                                <div className="bg-black/40 px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                     <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-gray-700 bg-black text-[#e50914] focus:ring-[#e50914] cursor-pointer shrink-0"
                                      checked={isAllSelected}
                                      onChange={() => {
                                        if (isAllSelected) {
                                          setSelectedEpisodes(selectedEpisodes.filter(id => !groupEpisodeIds.includes(id)));
                                        } else {
                                          setSelectedEpisodes([...new Set([...selectedEpisodes, ...groupEpisodeIds])]);
                                        }
                                      }}
                                    />
                                    <h3 className="text-sm sm:text-base font-bold truncate">
                                      {show.name} - Season {season.season_number}
                                      <span className="ml-2 text-[10px] sm:text-xs text-gray-500 font-medium">({groupEpisodes.length} episodes)</span>
                                    </h3>
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-[13px] text-gray-400 hover:text-black"
                                    onClick={() => {
                                      if (isAllSelected) {
                                        setSelectedEpisodes(selectedEpisodes.filter(id => !groupEpisodeIds.includes(id)));
                                      } else {
                                        setSelectedEpisodes([...new Set([...selectedEpisodes, ...groupEpisodeIds])]);
                                      }
                                    }}
                                  >
                                    {isAllSelected ? "Deselect All" : "Select All"}
                                  </Button>
                                </div>
                                <div className="p-4 space-y-3">
                                  {groupEpisodes.map((episode) => (
                                    <div key={episode.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 group hover:bg-black/40 transition-all">
                                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                        <div className="flex-1 min-w-0 w-full">
                                          <div className="flex items-center gap-3 mb-1">
                                            <input
                                              type="checkbox"
                                              className={`h-4 w-4 rounded border-gray-700 bg-black text-[#e50914] focus:ring-[#e50914] cursor-pointer shrink-0 transition-opacity ${selectedEpisodes.includes(episode.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                              checked={selectedEpisodes.includes(episode.id)}
                                              onChange={() => {
                                                if (selectedEpisodes.includes(episode.id)) {
                                                  setSelectedEpisodes(selectedEpisodes.filter(id => id !== episode.id));
                                                } else {
                                                  setSelectedEpisodes([...selectedEpisodes, episode.id]);
                                                }
                                              }}
                                            />
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Episode {episode.episode_number}</span>
                                          </div>
                                          <h4 className="text-sm sm:text-base font-semibold mb-1 truncate break-words line-clamp-1">{episode.title || "Untitled Episode"}</h4>
                                          {episode.description && <p className="text-xs text-gray-400 line-clamp-1 break-words mb-1">{episode.description}</p>}
                                          <p className="text-[10px] text-gray-500 truncate">URL: {truncateText(episode.video_url, 20)}</p>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                          <Button onClick={() => handleEditEpisode(episode)} size="sm" variant="outline" className="h-8"><Edit className="h-3.5 w-3.5" /></Button>
                                          <Button onClick={() => handleDeleteEpisode(episode.id)} size="sm" variant="destructive" className="h-8"><Trash2 className="h-3.5 w-3.5" /></Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          });
                        })}
                    </div>
                  </div>
                )}

                {/* Movies Results */}
                {filteredMovies.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                       <div className="flex items-center gap-3">
                         <h2 className="text-lg sm:text-xl font-bold text-[#e50914]">Matched Movies ({filteredMovies.length})</h2>
                         {selectedMovies.filter(id => filteredMovies.some(fm => fm.id === id)).length > 0 && (
                            <Button
                              onClick={() => handleBulkDelete("movies")}
                              variant="destructive"
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 h-8 text-[10px] sm:text-xs px-3"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Selected ({selectedMovies.filter(id => filteredMovies.some(fm => fm.id === id)).length})
                            </Button>
                         )}
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {filteredMovies.map((movie) => {
                        const hasPoster = movie.poster_url && movie.poster_url.trim() !== "";
                        return (
                          <div key={movie.id} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 sm:p-4 group hover:border-gray-700 transition-colors">
                            <div className="flex items-center gap-3 mb-3">
                              <input
                                type="checkbox"
                                className={`h-4 w-4 rounded border-gray-700 bg-black text-[#e50914] focus:ring-[#e50914] cursor-pointer shrink-0 transition-opacity ${selectedMovies.includes(movie.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                checked={selectedMovies.includes(movie.id)}
                                onChange={() => {
                                  if (selectedMovies.includes(movie.id)) {
                                    setSelectedMovies(selectedMovies.filter(id => id !== movie.id));
                                  } else {
                                    setSelectedMovies([...selectedMovies, movie.id]);
                                  }
                                }}
                              />
                              <h3 className="text-base font-semibold truncate flex-1 break-words">{movie.title}</h3>
                            </div>
                            {hasPoster ? (
                               <img src={convertToDirectUrl(movie.poster_url)} alt={truncateText(movie.title, 30)} className="w-full h-32 object-cover rounded mb-3" />
                            ) : (
                               <div className="w-full h-32 bg-gray-800 rounded mb-3 flex items-center justify-center">
                                 <Search className="h-8 w-8 text-gray-600" />
                               </div>
                            )}
                            <div className="flex gap-2">
                              <Button onClick={() => handleEditMovie(movie)} size="sm" variant="outline" className="flex-1 text-xs">Edit</Button>
                              <Button onClick={() => handleDeleteMovie(movie.id)} size="sm" variant="destructive" className="flex-1 text-xs">Delete</Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Shows Tab */}
          <TabsContent value="shows" className="mt-4 sm:mt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <h2 className="text-xl sm:text-2xl font-bold">Manage Shows</h2>
                  {bulkReport?.type === "shows" && (
                    <Button
                      onClick={() => setReportDialog(true)}
                      variant="outline"
                      size="sm"
                      className="text-gray-400 hover:text-black h-8 sm:h-9"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Report
                    </Button>
                  )}
                </div>
                <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-gray-800 shadow-sm w-full sm:w-auto">
                  <Button
                    data-testid="add-show-btn"
                    onClick={() => setShowDialog(true)}
                    className="bg-[#e50914] hover:bg-[#b00710] h-9 px-4 rounded-md text-sm font-semibold transition-all active:scale-95 flex-1 sm:flex-none"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Show
                  </Button>
                  <Button
                    onClick={() => handleOpenBulkDialog("shows")}
                    variant="ghost"
                    className="h-9 px-4 rounded-md text-sm font-medium hover:bg-white/10 hover:text-white transition-all active:scale-95 text-gray-300 flex-1 sm:flex-none"
                  >
                    Bulk Upload
                  </Button>
                </div>
              </div>

            {/* Responsive Show Cards Grid */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {shows
                  .slice((currentShowPage - 1) * ITEMS_PER_PAGE, currentShowPage * ITEMS_PER_PAGE)
                  .map((show) => {
                    const hasPoster =
                      show.poster_url && show.poster_url.trim() !== "";
                    return (
                      <div
                        key={show.id}
                        className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 sm:p-4 overflow-hidden hover:border-gray-700 transition-colors"
                      >
                        {hasPoster ? (
                          <img
                            src={convertToDirectUrl(show.poster_url)}
                            alt={show.name}
                            className="w-full h-40 sm:h-48 object-cover rounded-lg mb-3"
                          />
                        ) : (
                          <div className="relative w-full h-40 sm:h-48 overflow-hidden rounded-lg mb-3">
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-play w-10 h-10 sm:w-12 sm:h-12 text-[#e50914]"
                                aria-hidden="true"
                              >
                                <polygon points="6 3 20 12 6 21 6 3"></polygon>
                              </svg>
                            </div>
                          </div>
                        )}

                        <h3 className="text-base sm:text-lg font-semibold mb-2 line-clamp-1 break-words" title={show.name}>
                          {show.name}
                        </h3>
                        {show.description && (
                          <p className="text-xs sm:text-sm text-gray-400 mb-3 line-clamp-2 break-words">
                            {show.description}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            data-testid={`edit-show-${show.id}`}
                            onClick={() => handleEditShow(show)}
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs sm:text-sm"
                          >
                            <Edit className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Edit
                          </Button>
                          <Button
                            data-testid={`delete-show-${show.id}`}
                            onClick={() => handleDeleteShow(show.id)}
                            variant="destructive"
                            size="sm"
                            className="flex-1 text-xs sm:text-sm"
                          >
                            <Trash2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {Math.ceil(shows.length / ITEMS_PER_PAGE) > 1 && (
                <Pagination>
                  <PaginationContent className="flex-wrap justify-center">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => {
                          setCurrentShowPage(prev => Math.max(1, prev - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={currentShowPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                      />
                    </PaginationItem>
                    {renderPaginationItems(currentShowPage, Math.ceil(shows.length / ITEMS_PER_PAGE), setCurrentShowPage)}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          setCurrentShowPage(prev => Math.min(Math.ceil(shows.length / ITEMS_PER_PAGE), prev + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={currentShowPage === Math.ceil(shows.length / ITEMS_PER_PAGE) ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>

            {shows.length === 0 && (
              <div className="text-center py-8 sm:py-12">
                <p className="text-gray-400">No shows found. Click "Add Show" to create one.</p>
              </div>
            )}
          </TabsContent>

          {/* Seasons Tab */}
          <TabsContent value="seasons" className="mt-4 sm:mt-6">
            {(() => {
              const showsWithSeasons = shows.filter((show) => getSeasonsByShow(show.id).length > 0);
              const totalSeasonPages = Math.ceil(showsWithSeasons.length / ITEMS_PER_PAGE);

              return (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                      <h2 className="text-xl sm:text-2xl font-bold">Manage Seasons</h2>
                      {bulkReport?.type === "seasons" && (
                        <Button
                          onClick={() => setReportDialog(true)}
                          variant="outline"
                          size="sm"
                          className="text-gray-400 hover:text-black h-8 sm:h-9"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Report
                        </Button>
                      )}
                      {selectedSeasons.length > 0 && (
                        <Button
                          onClick={() => handleBulkDelete("seasons")}
                          variant="destructive"
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 h-8 sm:h-9"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Selected ({selectedSeasons.length})
                        </Button>
                      )}
                    </div>
                    <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-gray-800 shadow-sm w-full sm:w-auto">
                      <Button
                        data-testid="add-season-btn"
                        onClick={() => setSeasonDialog(true)}
                        className="bg-[#e50914] hover:bg-[#b00710] h-9 px-4 rounded-md text-sm font-semibold transition-all active:scale-95 flex-1 sm:flex-none"
                      >
                        <Plus className="mr-2 h-4 w-4" /> Add Season
                      </Button>
                      <Button
                        onClick={() => handleOpenBulkDialog("seasons")}
                        variant="ghost"
                        className="h-9 px-4 rounded-md text-sm font-medium hover:bg-white/10 hover:text-white transition-all active:scale-95 text-gray-300 flex-1 sm:flex-none"
                      >
                        Bulk Upload
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3 sm:space-y-4">
                      {showsWithSeasons.length === 0 ? (
                        <div className="text-center py-8 sm:py-12">
                          <p className="text-gray-400">No seasons found. Click "Add Season" to create one.</p>
                        </div>
                      ) : (
                        showsWithSeasons
                          .slice((currentSeasonPage - 1) * ITEMS_PER_PAGE, currentSeasonPage * ITEMS_PER_PAGE)
                          .map((show) => {
                            const showSeasons = getSeasonsByShow(show.id);
                            return (
                              <div
                                key={show.id}
                                className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 sm:p-4 overflow-hidden"
                              >
                                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 line-clamp-1 break-words" title={show.name}>
                                  {truncateText(show.name, 50)}
                                </h3>
                                <div className="space-y-2">
                                  {showSeasons.map((season) => (
                                      <div
                                        key={season.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 bg-[#1a1a1a] p-3 rounded border border-gray-800 group transition-all"
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <input
                                            type="checkbox"
                                            className={`h-4 w-4 rounded border-gray-700 bg-black text-[#e50914] focus:ring-[#e50914] cursor-pointer shrink-0 transition-opacity ${selectedSeasons.includes(season.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                            checked={selectedSeasons.includes(season.id)}
                                            onChange={() => {
                                              if (selectedSeasons.includes(season.id)) {
                                                setSelectedSeasons(selectedSeasons.filter(id => id !== season.id));
                                              } else {
                                                setSelectedSeasons([...selectedSeasons, season.id]);
                                              }
                                            }}
                                          />
                                          <span className="text-sm sm:text-base truncate flex-1" title={`Season ${season.season_number}${season.name ? ` - ${season.name}` : ''}`}>
                                            Season {season.season_number}
                                            {season.name && ` - ${truncateText(season.name, 30)}`}
                                          </span>
                                        </div>
                                      <div className="flex gap-2 flex-shrink-0 justify-end">
                                        <Button
                                          data-testid={`edit-season-${season.id}`}
                                          onClick={() => handleEditSeason(season)}
                                          variant="outline"
                                          size="sm"
                                          className="h-8 sm:h-9"
                                        >
                                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                        <Button
                                          data-testid={`delete-season-${season.id}`}
                                          onClick={() => handleDeleteSeason(season.id)}
                                          variant="destructive"
                                          size="sm"
                                          className="h-8 sm:h-9"
                                        >
                                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>

                    {totalSeasonPages > 1 && (
                      <Pagination>
                        <PaginationContent className="flex-wrap justify-center">
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => {
                                setCurrentSeasonPage(prev => Math.max(1, prev - 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={currentSeasonPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                            />
                          </PaginationItem>
                          {renderPaginationItems(currentSeasonPage, totalSeasonPages, setCurrentSeasonPage)}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => {
                                setCurrentSeasonPage(prev => Math.min(totalSeasonPages, prev + 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={currentSeasonPage === totalSeasonPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                </>
              );
            })()}
          </TabsContent>

          {/* Episodes Tab */}
          <TabsContent value="episodes" className="mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <h2 className="text-xl sm:text-2xl font-bold">Manage Episodes</h2>
                {bulkReport?.type === "episodes" && (
                  <Button
                    onClick={() => setReportDialog(true)}
                    variant="outline"
                    size="sm"
                    className="text-gray-400 hover:text-black h-8 sm:h-9"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Report
                  </Button>
                )}
                {selectedEpisodes.length > 0 && (
                  <Button
                    onClick={() => handleBulkDelete("episodes")}
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 h-8 sm:h-9"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedEpisodes.length})
                  </Button>
                )}
                {episodes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const pageItems = episodes.slice((currentEpisodePage - 1) * ITEMS_PER_PAGE, currentEpisodePage * ITEMS_PER_PAGE).map(e => e.id);
                      const allSelected = pageItems.every(id => selectedEpisodes.includes(id));
                      if (allSelected) {
                        setSelectedEpisodes(selectedEpisodes.filter(id => !pageItems.includes(id)));
                      } else {
                        setSelectedEpisodes([...new Set([...selectedEpisodes, ...pageItems])]);
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-black text-[13px]"
                  >
                    {episodes.slice((currentEpisodePage - 1) * ITEMS_PER_PAGE, currentEpisodePage * ITEMS_PER_PAGE).length > 0 && episodes.slice((currentEpisodePage - 1) * ITEMS_PER_PAGE, currentEpisodePage * ITEMS_PER_PAGE).every(e => selectedEpisodes.includes(e.id)) ? "Deselect Page" : "Select Page"}
                  </Button>
                )}
              </div>
              <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-gray-800 shadow-sm w-full sm:w-auto">
                <Button
                  data-testid="add-episode-btn"
                  onClick={() => setEpisodeDialog(true)}
                  className="bg-[#e50914] hover:bg-[#b00710] h-9 px-4 rounded-md text-sm font-semibold transition-all active:scale-95 flex-1 sm:flex-none"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Episode
                </Button>
                <Button
                  onClick={() => handleOpenBulkDialog("episodes")}
                  variant="ghost"
                  className="h-9 px-4 rounded-md text-sm font-medium hover:bg-white/10 hover:text-white transition-all active:scale-95 text-gray-300 flex-1 sm:flex-none"
                >
                  Bulk Upload
                </Button>
              </div>
            </div>
            {/* Episode mapping */}
            <div className="space-y-6">
              <div className="space-y-3 sm:space-y-4">
                {episodes
                  .slice((currentEpisodePage - 1) * ITEMS_PER_PAGE, currentEpisodePage * ITEMS_PER_PAGE)
                  .map((episode) => {
                    const show = shows.find((s) => s.id === episode.show_id);
                    const season = seasons.find((s) => s.id === episode.season_id);
                    return (
                      <div
                        key={episode.id}
                        className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 sm:p-4 overflow-hidden group transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center gap-3 mb-1">
                              <input
                                type="checkbox"
                                className={`h-4 w-4 rounded border-gray-700 bg-black text-[#e50914] focus:ring-[#e50914] cursor-pointer shrink-0 transition-opacity ${selectedEpisodes.includes(episode.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                checked={selectedEpisodes.includes(episode.id)}
                                onChange={() => {
                                  if (selectedEpisodes.includes(episode.id)) {
                                    setSelectedEpisodes(selectedEpisodes.filter(id => id !== episode.id));
                                  } else {
                                    setSelectedEpisodes([...selectedEpisodes, episode.id]);
                                  }
                                }}
                              />
                              <p className="text-xs sm:text-sm text-gray-400 truncate flex-1" title={`${show?.name} - Season ${season?.season_number}`}>
                                {show?.name} - Season {season?.season_number}
                              </p>
                            </div>
                            <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 break-words" title={`Episode ${episode.episode_number}: ${episode.title}`}>
                              Episode {episode.episode_number}: {truncateText(episode.title, 50)/*foundinggggggggg */}
                            </h3>
                            {episode.description && (
                              <p className="text-xs sm:text-sm text-gray-400 mb-2 break-words line-clamp-2">
                                {episode.description}
                              </p>
                            )}
                            <p className="text-xs sm:text-sm text-gray-500 truncate" title={episode.video_url}>
                              URL: {truncateText(episode.video_url, 60)}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              data-testid={`edit-episode-${episode.id}`}
                              onClick={() => handleEditEpisode(episode)}
                              variant="outline"
                              size="sm"
                              className="h-8 sm:h-9"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              data-testid={`delete-episode-${episode.id}`}
                              onClick={() => handleDeleteEpisode(episode.id)}
                              variant="destructive"
                              size="sm"
                              className="h-8 sm:h-9"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {episodes.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-gray-400">No episodes found. Click "Add Episode" to create one.</p>
                  </div>
                )}
              </div>

              {Math.ceil(episodes.length / ITEMS_PER_PAGE) > 1 && (
                <Pagination>
                  <PaginationContent className="flex-wrap justify-center">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => {
                          setCurrentEpisodePage(prev => Math.max(1, prev - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={currentEpisodePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                      />
                    </PaginationItem>
                    {renderPaginationItems(currentEpisodePage, Math.ceil(episodes.length / ITEMS_PER_PAGE), setCurrentEpisodePage)}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          setCurrentEpisodePage(prev => Math.min(Math.ceil(episodes.length / ITEMS_PER_PAGE), prev + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={currentEpisodePage === Math.ceil(episodes.length / ITEMS_PER_PAGE) ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </TabsContent>

          {/* Movies Tab */}
          <TabsContent value="movies" className="mt-4 sm:mt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                <h2 className="text-xl sm:text-2xl font-bold">Manage Movies</h2>
                {bulkReport?.type === "movies" && (
                  <Button
                    onClick={() => setReportDialog(true)}
                    variant="outline"
                    size="sm"
                    className="text-gray-400 hover:text-black h-8 sm:h-9"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Report
                  </Button>
                )}
                {selectedMovies.length > 0 && (
                  <Button
                    onClick={() => handleBulkDelete("movies")}
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 h-8 sm:h-9"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Selected ({selectedMovies.length})
                  </Button>
                )}
                {movies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const pageItems = movies.slice((currentMoviePage - 1) * ITEMS_PER_PAGE, currentMoviePage * ITEMS_PER_PAGE).map(m => m.id);
                      const allSelected = pageItems.every(id => selectedMovies.includes(id));
                      if (allSelected) {
                        setSelectedMovies(selectedMovies.filter(id => !pageItems.includes(id)));
                      } else {
                        setSelectedMovies([...new Set([...selectedMovies, ...pageItems])]);
                      }
                    }}
                    className="text-xs text-gray-400 hover:text-black text-[13px]"
                  >
                    {movies.slice((currentMoviePage - 1) * ITEMS_PER_PAGE, currentMoviePage * ITEMS_PER_PAGE).length > 0 && movies.slice((currentMoviePage - 1) * ITEMS_PER_PAGE, currentMoviePage * ITEMS_PER_PAGE).every(m => selectedMovies.includes(m.id)) ? "Deselect Page" : "Select Page"}
                  </Button>
                )}
              </div>
              <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-gray-800 shadow-sm w-full sm:w-auto">
                <Button
                  data-testid="add-movie-btn"
                  onClick={() => setMovieDialog(true)}
                  className="bg-[#e50914] hover:bg-[#b00710] h-9 px-4 rounded-md text-sm font-semibold transition-all active:scale-95 flex-1 sm:flex-none"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Movie
                </Button>
                <Button
                  onClick={() => handleOpenBulkDialog("movies")}
                  variant="ghost"
                  className="h-9 px-4 rounded-md text-sm font-medium hover:bg-white/10 hover:text-white transition-all active:scale-95 text-gray-300 flex-1 sm:flex-none"
                >
                  Bulk Upload
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3 sm:space-y-4">
                {movies
                  .slice((currentMoviePage - 1) * ITEMS_PER_PAGE, currentMoviePage * ITEMS_PER_PAGE)
                  .map((movie) => {
                    const show = shows.find((s) => s.id === movie.show_id);
                    return (
                      <div
                        key={movie.id}
                        className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-3 sm:p-4 overflow-hidden group transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                          <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center gap-3 mb-1">
                              <input
                                type="checkbox"
                                className={`h-4 w-4 rounded border-gray-700 bg-black text-[#e50914] focus:ring-[#e50914] cursor-pointer shrink-0 transition-opacity ${selectedMovies.includes(movie.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                checked={selectedMovies.includes(movie.id)}
                                onChange={() => {
                                  if (selectedMovies.includes(movie.id)) {
                                    setSelectedMovies(selectedMovies.filter(id => id !== movie.id));
                                  } else {
                                    setSelectedMovies([...selectedMovies, movie.id]);
                                  }
                                }}
                              />
                              <p className="text-xs sm:text-sm text-gray-400 truncate flex-1" title={show?.name}>
                                {show?.name || "Single Movie"}
                              </p>
                            </div>
                            <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2 break-words line-clamp-1" title={movie.title}>
                              {truncateText(movie.title, 60)}
                            </h3>
                            {movie.description && (
                              <p className="text-xs sm:text-sm text-gray-400 mb-2 break-words line-clamp-2">
                                {movie.description}
                              </p>
                            )}
                            <p className="text-xs sm:text-sm text-gray-500 truncate" title={movie.video_url}>
                              URL: {truncateText(movie.video_url, 60)}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button
                              data-testid={`edit-movie-${movie.id}`}
                              onClick={() => handleEditMovie(movie)}
                              variant="outline"
                              size="sm"
                              className="h-8 sm:h-9"
                            >
                              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                            <Button
                              data-testid={`delete-movie-${movie.id}`}
                              onClick={() => handleDeleteMovie(movie.id)}
                              variant="destructive"
                              size="sm"
                              className="h-8 sm:h-9"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {movies.length === 0 && (
                  <div className="text-center py-8 sm:py-12">
                    <p className="text-gray-400">No movies found. Click "Add Movie" to create one.</p>
                  </div>
                )}
              </div>

              {Math.ceil(movies.length / ITEMS_PER_PAGE) > 1 && (
                <Pagination>
                  <PaginationContent className="flex-wrap justify-center">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => {
                          setCurrentMoviePage(prev => Math.max(1, prev - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={currentMoviePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                      />
                    </PaginationItem>
                    {renderPaginationItems(currentMoviePage, Math.ceil(movies.length / ITEMS_PER_PAGE), setCurrentMoviePage)}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          setCurrentMoviePage(prev => Math.min(Math.ceil(movies.length / ITEMS_PER_PAGE), prev + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={currentMoviePage === Math.ceil(movies.length / ITEMS_PER_PAGE) ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;