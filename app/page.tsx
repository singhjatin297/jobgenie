"use client";
export default function Home() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/resume-upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" name="resume" accept=".pdf" required />
      <button type="submit">Upload</button>
    </form>
  );
}
