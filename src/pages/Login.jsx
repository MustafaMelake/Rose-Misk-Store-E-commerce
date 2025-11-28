import React, { useState } from "react";
import { Link } from "react-router-dom";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login Data:", form);
  };

  return (
    <div className="flex justify-center items-center min-h-screen px-4">
      <div className="w-full max-w-md bg-white dark:bg-black rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl prata-regular text-gold-base text-center mb-6">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            className="inputStyle dark:bg-black dark:border dark:border-white/20 dark:text-gray-300"
            onChange={handleChange}
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="inputStyle dark:bg-black dark:border dark:border-white/20 dark:text-gray-300"
            onChange={handleChange}
          />

          <button
            type="submit"
            className="w-full py-3 bg-black text-white rounded-xl hover:bg-gold-base hover:text-black transition dark:bg-gold-dark-20"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-4 text-sm dark:text-white">
          Don't have an account?{" "}
          <Link to="/signup" className="text-black underline dark:text-white">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
