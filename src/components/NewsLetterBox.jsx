import React from "react";

const NewsLetterBox = () => {
  const onSumbit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="text-center">
      <p className="text-2xl  font-medium text-gold-light-20">
        Subscribe Now & Get 20% OFF!
      </p>
      <p className="text-gray-400 mt-3 dark:text-white">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Amet ad quo
        modi magni, nulla aut!
      </p>
      <form
        onSubmit={onSumbit}
        className="w-full flex items-center mx-auto sm:w-1/2 gap-3 border my-6 pl-3 dark:border-white"
      >
        <input
          type="email"
          className="w-full sm:flex-1 outline-none dark:text-white bg-white dark:bg-black"
          placeholder="Enter Your Email"
          required
        />
        <button
          type="submit"
          className="bg-black dark:bg-white dark:text-black text-white text-xs px-10 py-5"
        >
          Subscribe{" "}
        </button>
      </form>
    </div>
  );
};

export default NewsLetterBox;
