const API_BASE = "http://127.0.0.1:8000";

async function postJob() {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    const jobData = {
      title: document.getElementById("title").value,
      company: document.getElementById("company").value,
      location: document.getElementById("location").value,
      job_type: document.getElementById("job_type").value,
      experience_required: document.getElementById("experience_required").value,
      salary_range: document.getElementById("salary_range").value,
      description: document.getElementById("description").value,
      requirements: document.getElementById("requirements").value,
      responsibilities: document.getElementById("responsibilities").value
    };

    const response = await fetch(`${API_BASE}/api/jobs/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(jobData)
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.detail || "Error posting job");
      return;
    }

    alert("Job Posted Successfully ✅");

    // Redirect to dashboard
    window.location.href = "dashboard.html";

  } catch (error) {
    console.error("Error:", error);
    alert("Something went wrong");
  }
}
