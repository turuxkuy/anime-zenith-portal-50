
document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
  }

  // Load donghua data for the homepage
  loadDonghuaList();
});

// Function to load donghua list
function loadDonghuaList() {
  const donghuaGrid = document.getElementById('donghuaGrid');
  if (!donghuaGrid) return;

  // Try to get donghua data from localStorage
  let donghuaData = JSON.parse(localStorage.getItem('donghuaData')) || [];

  // If no data exists, create some sample data
  if (donghuaData.length === 0) {
    donghuaData = createSampleDonghua();
    localStorage.setItem('donghuaData', JSON.stringify(donghuaData));
  }

  // Clear the grid before adding new items
  donghuaGrid.innerHTML = '';

  // Create donghua cards for each item
  donghuaData.forEach((donghua, index) => {
    const donghuaCard = document.createElement('a');
    donghuaCard.href = `donghua.html?id=${index}`;
    donghuaCard.className = 'donghua-card';
    donghuaCard.innerHTML = `
      <img src="${donghua.poster || 'images/default-poster.jpg'}" alt="${donghua.title}">
      <div class="donghua-overlay">
        <h3 class="donghua-title">${donghua.title}</h3>
        <div class="donghua-meta">
          <span>${donghua.year}</span>
          <span>${donghua.genre}</span>
          <span>${donghua.status}</span>
        </div>
      </div>
    `;
    donghuaGrid.appendChild(donghuaCard);
  });
}

// Function to create sample donghua data
function createSampleDonghua() {
  return [
    {
      id: 0,
      title: "Battle Through the Heavens",
      year: 2018,
      genre: "Action, Fantasy",
      status: "Ongoing",
      rating: 8.5,
      synopsis: "Xiao Yan, whose mother was killed when he was just 9 years old. Xiao Yan was once a talented boy but 3 years ago his powers got sealed. Now he meets Yao Chen who helps him become stronger.",
      poster: "https://via.placeholder.com/300x450?text=Battle+Through+the+Heavens",
      backdrop: "https://via.placeholder.com/800x450?text=Battle+Through+the+Heavens"
    },
    {
      id: 1,
      title: "Soul Land",
      year: 2019,
      genre: "Adventure, Fantasy",
      status: "Ongoing",
      rating: 8.8,
      synopsis: "Tang San spends his life in pursuit of becoming a great soul master, and after helping his teacher become the greatest ever, Tang San learns that he can control his spirit when he forms a contract with a blue silver grass, which is a spirit a hundred years old.",
      poster: "https://via.placeholder.com/300x450?text=Soul+Land",
      backdrop: "https://via.placeholder.com/800x450?text=Soul+Land"
    },
    {
      id: 2,
      title: "The King's Avatar",
      year: 2017,
      genre: "Action, Game",
      status: "Completed",
      rating: 9.2,
      synopsis: "A professional gamer is forced to retire from an elite team. Looking for a fresh start, he begins his journey in a new game server, creating a new character and using his extensive gaming knowledge to climb the ranks.",
      poster: "https://via.placeholder.com/300x450?text=The+King's+Avatar",
      backdrop: "https://via.placeholder.com/800x450?text=The+King's+Avatar"
    },
    {
      id: 3,
      title: "Martial Universe",
      year: 2020,
      genre: "Action, Martial Arts",
      status: "Ongoing",
      rating: 7.9,
      synopsis: "Lin Dong, a child from a small village discovers a mysterious stone talisman that grants him powers and begins a journey of discovering earth's secrets, fighting monsters, protecting his family and realizing his own destiny.",
      poster: "https://via.placeholder.com/300x450?text=Martial+Universe",
      backdrop: "https://via.placeholder.com/800x450?text=Martial+Universe"
    },
    {
      id: 4,
      title: "Spirit Sword Mountain",
      year: 2019,
      genre: "Comedy, Fantasy",
      status: "Completed",
      rating: 8.3,
      synopsis: "Wang Lu, a smart boy with low physical strength from a poor family, is very calculating and unemotional towards his classmates. When isekaied, he learns to strategize against monsters in a fantasy world.",
      poster: "https://via.placeholder.com/300x450?text=Spirit+Sword+Mountain",
      backdrop: "https://via.placeholder.com/800x450?text=Spirit+Sword+Mountain"
    },
    {
      id: 5,
      title: "The Daily Life of the Immortal King",
      year: 2020,
      genre: "Comedy, Fantasy",
      status: "Ongoing",
      rating: 8.7,
      synopsis: "Wang Ling has become super powerful since childhood. But now he just wants to be a normal high school student and not attract attention. However, he can't help but attract girls and other powerful beings.",
      poster: "https://via.placeholder.com/300x450?text=Immortal+King",
      backdrop: "https://via.placeholder.com/800x450?text=Immortal+King"
    }
  ];
}
