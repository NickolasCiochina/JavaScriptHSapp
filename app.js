document.addEventListener('DOMContentLoaded', function() {
  const ITEMS_PER_PAGE = 10;
  let currentPage = 1;
  let selectedTier = null;
  let minionData = [];
  let heroData = [];

  // Select all necessary elements
  const tabBarElement = document.querySelector('.mdc-tab-bar');
  const tabScrollerElement = document.querySelector('.mdc-tab-scroller');
  const minionsContainer = document.getElementById('minions-container');
  const heroesContainer = document.getElementById('heroes-container');
  const buildsContainer = document.getElementById('builds-container');
  const noResultsContainer = document.querySelector('.no-results');
  const paginationTop = document.getElementById('pagination-top');
  const paginationBottom = document.getElementById('pagination-bottom');
  const paginationTopHeroes = document.getElementById('pagination-top-heroes');
  const paginationBottomHeroes = document.getElementById('pagination-bottom-heroes');
  const searchBar = document.getElementById('search-bar');
  const searchButton = document.querySelector('.mdc-top-app-bar__action-item[aria-label="Search"]');
  const searchContainer = document.getElementById('search-container');
  const prevButtonTop = document.getElementById('prev-button-top');
  const nextButtonTop = document.getElementById('next-button-top');
  const pageInfoTop = document.getElementById('page-info-top');
  const prevButtonBottom = document.getElementById('prev-button-bottom');
  const nextButtonBottom = document.getElementById('next-button-bottom');
  const pageInfoBottom = document.getElementById('page-info-bottom');
  const prevButtonTopHeroes = document.getElementById('prev-button-top-heroes');
  const nextButtonTopHeroes = document.getElementById('next-button-top-heroes');
  const pageInfoTopHeroes = document.getElementById('page-info-top-heroes');
  const prevButtonBottomHeroes = document.getElementById('prev-button-bottom-heroes');
  const nextButtonBottomHeroes = document.getElementById('next-button-bottom-heroes');
  const pageInfoBottomHeroes = document.getElementById('page-info-bottom-heroes'); // Ensure this line exists

  // Initialize Material Design components
  if (tabBarElement) {
    const tabBar = new mdc.tabBar.MDCTabBar(tabBarElement);
    const tabScroller = new mdc.tabScroller.MDCTabScroller(tabScrollerElement);
    const tabButtons = document.querySelectorAll('.mdc-tab');
    tabButtons.forEach((button, index) => {
      button.addEventListener('click', () => {
        selectedTier = index;
        currentPage = 1;
        filterMinions();
      });
    });
  }

  function handleHashChange() {
    const hash = decodeURIComponent(window.location.hash.substring(1));
    const hero = heroData.find(h => h.name.toLowerCase() === hash);
    const minion = minionData.find(m => m.name.toLowerCase() === hash);
    if (hero) {
      showHeroDetails(hero, false);
    } else if (minion) {
      showMinionDetails(minion, buildsContainer ? 'builder' : 'default', false);
    }
  }

  window.addEventListener('hashchange', handleHashChange);

  // Fetch minion data
  if (minionsContainer || buildsContainer) {
    fetch('HearthStoneData.json')
      .then(response => response.json())
      .then(data => {
        minionData = data.minions;
        if (minionsContainer) {
          filterMinions();
        }
        if (buildsContainer) {
          displayBuilds(data.builds);
        }
        handleHashChange(); // Check hash after data is loaded
      })
      .catch(error => console.error('Error fetching minions:', error));
  }

  // Fetch hero data
  if (heroesContainer) {
    fetch('HearthStoneData.json')
      .then(response => response.json())
      .then(data => {
        heroData = data.heroes;
        filterHeroes();
        handleHashChange(); // Check hash after data is loaded
      })
      .catch(error => console.error('Error fetching heroes:', error));
  }

  if (searchBar) {
    searchBar.addEventListener('input', () => {
      currentPage = 1;
      if (heroesContainer) {
        filterHeroes();
      } else if (minionsContainer) {
        filterMinions();
      }
    });

    if (searchButton) {
      searchButton.addEventListener('click', () => {
        searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
      });
    }
  }

  function displayMinions(minions) {
    if (minionsContainer) {
      minionsContainer.innerHTML = '';

      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, minions.length);
      const currentMinions = minions.slice(startIndex, endIndex);

      if (currentMinions.length === 0) {
        noResultsContainer.classList.remove('hidden');
        paginationTop.classList.add('hidden');
        paginationBottom.classList.add('hidden');
      } else {
        noResultsContainer.classList.add('hidden');
        currentMinions.forEach(minion => {
          const minionCard = document.createElement('div');
          minionCard.classList.add('minion-card');

          const minionImage = document.createElement('img');
          minionImage.src = `Images/Minions${minion.variants.normal.image}`;
          minionImage.alt = minion.name;
          minionCard.appendChild(minionImage);

          minionCard.addEventListener('click', () => showMinionDetails(minion));

          minionsContainer.appendChild(minionCard);
        });

        paginationTop.classList.remove('hidden');
        paginationBottom.classList.remove('hidden');
      }

      updatePagination(minions.length);
    }
  }

  function displayHeroes(heroes) {
    if (heroesContainer) {
      heroesContainer.innerHTML = '';

      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, heroes.length);
      const currentHeroes = heroes.slice(startIndex, endIndex);

      if (currentHeroes.length === 0) {
        noResultsContainer.classList.remove('hidden');
      } else {
        noResultsContainer.classList.add('hidden');
        currentHeroes.forEach(hero => {
          const heroCard = document.createElement('div');
          heroCard.classList.add('hero-card');

          const heroImage = document.createElement('img');
          heroImage.src = `Images/Heroes${hero.hero_image}`;
          heroImage.alt = hero.name;
          heroCard.appendChild(heroImage);

          const heroName = document.createElement('h3');
          heroName.textContent = hero.name;
          heroCard.appendChild(heroName);

          heroCard.addEventListener('click', () => showHeroDetails(hero));

          heroesContainer.appendChild(heroCard);
        });
      }

      updatePaginationHeroes(heroes.length);
    }
  }

  function showMinionDetails(minion, context = 'default', pushState = true) {
    const sheetId = context === 'builder' ? 'builder-minion-details-sheet' : 'minion-details-sheet';
    const sheet = document.getElementById(sheetId);
    if (!sheet) {
      console.error(`Minion details sheet with id ${sheetId} not found`);
      return;
    }

    const normalVariantImage = sheet.querySelector('.normal-variant');
    const goldenVariantImage = sheet.querySelector('.golden-variant');
    const keywordsList = sheet.querySelector(context === 'builder' ? '#keywords-list-builder' : '#keywords-list');

    if (!normalVariantImage || !goldenVariantImage || !keywordsList) {
      console.error('Some elements inside the minion details sheet are not found');
      return;
    }

    normalVariantImage.src = `Images/Minions${minion.variants.normal.image}`;
    goldenVariantImage.src = `Images/Golden_Minions${minion.variants.golden.image}`;

    keywordsList.innerHTML = '';
    minion.keywords.forEach(keyword => {
      const li = document.createElement('li');
      li.textContent = keyword;
      keywordsList.appendChild(li);
    });

    sheet.classList.remove('sheet-out-of-view');
    document.body.classList.add('sheet-open');
    if (pushState) {
      history.pushState({ minion: minion.name.toLowerCase() }, null, `#${encodeURIComponent(minion.name.toLowerCase())}`);
    }
  }

  function showHeroDetails(hero, pushState = true) {
    const sheet = document.getElementById('hero-details-sheet');
    if (!sheet) {
      console.error('Hero details sheet not found');
      return;
    }

    const heroImage = sheet.querySelector('.hero-img');
    const heroPowerImage = sheet.querySelector('.hero-power-img');
    const recommendedTypesList = sheet.querySelector('#recommended-types-list');
    const heroName = sheet.querySelector('.hero-name');

    if (!heroImage || !heroPowerImage || !recommendedTypesList || !heroName) {
      console.error('Some elements inside the hero details sheet are not found');
      return;
    }

    heroImage.src = `Images/Heroes${hero.hero_image}`;
    heroPowerImage.src = `Images/Hero_Powers${hero.hero_power_image}`;
    heroName.textContent = hero.name;

    recommendedTypesList.innerHTML = '';
    hero.recommended_types.forEach(type => {
      const li = document.createElement('li');
      li.textContent = type;
      recommendedTypesList.appendChild(li);
    });

    sheet.classList.remove('sheet-out-of-view');
    document.body.classList.add('sheet-open');
    if (pushState) {
      history.pushState({ hero: hero.name.toLowerCase() }, null, `#${encodeURIComponent(hero.name.toLowerCase())}`);
    }
  }

  window.addEventListener('popstate', function(event) {
    if (event.state) {
      const { minion, hero } = event.state;
      if (minion) {
        const foundMinion = minionData.find(m => m.name.toLowerCase() === minion);
        if (foundMinion) {
          showMinionDetails(foundMinion, buildsContainer ? 'builder' : 'default', false);
        }
      } else if (hero) {
        const foundHero = heroData.find(h => h.name.toLowerCase() === hero);
        if (foundHero) {
          showHeroDetails(foundHero, false);
        }
      }
    } else {
      document.querySelectorAll('.sheet').forEach(sheet => {
        sheet.classList.add('sheet-out-of-view');
      });
      document.body.classList.remove('sheet-open');
    }
  });

  document.querySelectorAll('.mdc-top-app-bar__navigation-icon-close').forEach(button => {
    button.addEventListener('click', () => {
      const sheet = button.closest('.sheet');
      if (sheet) {
        sheet.classList.add('sheet-out-of-view');
        document.body.classList.remove('sheet-open');
        history.pushState(null, null, ' ');
      }
    });
  });

  document.querySelectorAll('.share-button').forEach(button => {
    button.addEventListener('click', () => {
      const url = window.location.href;
      const shareData = {
        title: document.title,
        text: '',
        url: url
      };

      if (navigator.share) {
        navigator.share(shareData)
          .then(() => console.log('Successfully shared'))
          .catch(error => console.error('Error sharing', error));
      } else {
        navigator.clipboard.writeText(url).then(() => {
          alert('Link copied to clipboard');
        }).catch(error => console.error('Error copying to clipboard', error));
      }
    });
  });

  const topAppBarElement = document.querySelector('.mdc-top-app-bar');
  if (topAppBarElement) {
    new mdc.topAppBar.MDCTopAppBar(topAppBarElement);
  }

  const drawerLeftElement = document.querySelector('.mdc-drawer-left');
  if (drawerLeftElement) {
    const drawerLeft = new mdc.drawer.MDCDrawer(drawerLeftElement);
    const menuButtonLeft = document.querySelector('.mdc-top-app-bar__navigation-icon');

    if (menuButtonLeft) {
      menuButtonLeft.addEventListener('click', () => {
        drawerLeft.open = !drawerLeft.open;
      });
    }

    const navLinksLeft = document.querySelectorAll('.mdc-list-item-left');
    navLinksLeft.forEach(link => {
      link.addEventListener('click', () => {
        drawerLeft.open = false;
      });
    });
  }

  const prevButtonElements = [
    prevButtonTop, prevButtonBottom, prevButtonTopHeroes, prevButtonBottomHeroes
  ];

  prevButtonElements.forEach(button => {
    if (button) {
      button.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          if (heroesContainer) {
            filterHeroes();
          } else if (minionsContainer) {
            filterMinions();
          }
        }
      });
    }
  });

  const nextButtonElements = [
    nextButtonTop, nextButtonBottom, nextButtonTopHeroes, nextButtonBottomHeroes
  ];

  nextButtonElements.forEach(button => {
    if (button) {
      button.addEventListener('click', () => {
        const totalMinions = minionData.length;
        const totalHeroes = heroData.length;
        const totalPagesMinions = Math.ceil(totalMinions / ITEMS_PER_PAGE);
        const totalPagesHeroes = Math.ceil(totalHeroes / ITEMS_PER_PAGE);
        if ((minionsContainer && currentPage < totalPagesMinions) || (heroesContainer && currentPage < totalPagesHeroes)) {
          currentPage++;
          if (heroesContainer) {
            filterHeroes();
          } else if (minionsContainer) {
            filterMinions();
          }
        }
      });
    }
  });

  function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    pageInfoTop.textContent = `Page ${currentPage} of ${totalPages}`;
    pageInfoBottom.textContent = `Page ${currentPage} of ${totalPages}`;

    if (totalItems === 0) {
      paginationTop.classList.add('hidden');
      paginationBottom.classList.add('hidden');
    } else {
      paginationTop.classList.remove('hidden');
      paginationBottom.classList.remove('hidden');
    }

    if (currentPage === 1) {
      prevButtonTop.classList.add('hidden');
      prevButtonBottom.classList.add('hidden');
    } else {
      prevButtonTop.classList.remove('hidden');
      prevButtonBottom.classList.remove('hidden');
    }

    if (currentPage === totalPages) {
      nextButtonTop.classList.add('hidden');
      nextButtonBottom.classList.add('hidden');
    } else {
      nextButtonTop.classList.remove('hidden');
      nextButtonBottom.classList.remove('hidden');
    }
  }

  function updatePaginationHeroes(totalItems) {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    pageInfoTopHeroes.textContent = `Page ${currentPage} of ${totalPages}`;
    pageInfoBottomHeroes.textContent = `Page ${currentPage} of ${totalPages}`;

    if (totalItems === 0) {
      paginationTopHeroes.classList.add('hidden');
      paginationBottomHeroes.classList.add('hidden');
    } else {
      paginationTopHeroes.classList.remove('hidden');
      paginationBottomHeroes.classList.remove('hidden');
    }

    if (currentPage === 1) {
      prevButtonTopHeroes.classList.add('hidden');
      prevButtonBottomHeroes.classList.add('hidden');
    } else {
      prevButtonTopHeroes.classList.remove('hidden');
      prevButtonBottomHeroes.classList.remove('hidden');
    }

    if (currentPage === totalPages) {
      nextButtonTopHeroes.classList.add('hidden');
      nextButtonBottomHeroes.classList.add('hidden');
    } else {
      nextButtonTopHeroes.classList.remove('hidden');
      nextButtonBottomHeroes.classList.remove('hidden');
    }
  }

  function filterMinions() {
    const query = searchBar ? searchBar.value.toLowerCase() : '';
    let filteredMinions = minionData;

    if (selectedTier !== null) {
      filteredMinions = selectedTier === 0 ? filteredMinions : filteredMinions.filter(minion => minion.tier === selectedTier);
    }

    if (query) {
      filteredMinions = filteredMinions.filter(minion => minion.name.toLowerCase().includes(query));
    }

    displayMinions(filteredMinions);
  }

  function filterHeroes() {
    const searchBar = document.getElementById('search-bar');
    if (!searchBar) {
      console.error('Search bar not found');
      return;
    }
    const query = searchBar.value.toLowerCase();
    let filteredHeroes = heroData;

    if (query) {
      filteredHeroes = filteredHeroes.filter(hero => hero.name.toLowerCase().includes(query));
    }

    displayHeroes(filteredHeroes);
  }

  // Display builds
  function displayBuilds(builds) {
    if (!buildsContainer) {
      return;
    }

    buildsContainer.innerHTML = '';

    builds.forEach(build => {
      const buildCard = document.createElement('div');
      buildCard.classList.add('build-card');

      const buildImage = document.createElement('img');
      buildImage.src = `Images/Builds${build["build-image"]}`;
      buildImage.alt = build.name;
      buildCard.appendChild(buildImage);

      const buildName = document.createElement('h2');
      buildName.textContent = build.name;
      buildCard.appendChild(buildName);

      const buildDescription = document.createElement('p');
      buildDescription.textContent = build.description;
      buildCard.appendChild(buildDescription);

      const showDetailsButton = document.createElement('button');
      showDetailsButton.classList.add('show-details-button', 'mdc-button', 'mdc-button--outlined');
      showDetailsButton.textContent = 'Show Details';
      buildCard.appendChild(showDetailsButton);

      const buildDetails = document.createElement('div');
      buildDetails.classList.add('build-details');

      const minionsTitle = document.createElement('h3');
      minionsTitle.textContent = 'Base Setup Minions:';
      buildDetails.appendChild(minionsTitle);

      const minionsList = document.createElement('ul');
      build.minions.forEach(minionName => {
        const minion = minionData.find(m => m.name === minionName);
        if (minion) {
          const minionItem = document.createElement('li');
          const minionLink = document.createElement('a');
          minionLink.href = `#${encodeURIComponent(minion.name.toLowerCase())}`;
          minionLink.textContent = minion.name;
          minionLink.addEventListener('click', (event) => {
            event.preventDefault();
            showMinionDetails(minion, 'builder');
          });
          minionItem.appendChild(minionLink);
          minionsList.appendChild(minionItem);
        }
      });
      buildDetails.appendChild(minionsList);

      const extraMinionsTitle = document.createElement('h3');
      extraMinionsTitle.textContent = 'Replacement Minions:';
      buildDetails.appendChild(extraMinionsTitle);

      const extraMinionsList = document.createElement('ul');
      build['extra-minions'].forEach(extraMinionName => {
        const minion = minionData.find(m => m.name === extraMinionName);
        if (minion) {
          const minionItem = document.createElement('li');
          const minionLink = document.createElement('a');
          minionLink.href = `#${encodeURIComponent(minion.name.toLowerCase())}`;
          minionLink.textContent = minion.name;
          minionLink.addEventListener('click', (event) => {
            event.preventDefault();
            showMinionDetails(minion, 'builder');
          });
          minionItem.appendChild(minionLink);
          extraMinionsList.appendChild(minionItem);
        }
      });
      buildDetails.appendChild(extraMinionsList);

      buildCard.appendChild(buildDetails);

      showDetailsButton.addEventListener('click', () => {
        const isVisible = buildDetails.style.display === 'block';
        buildDetails.style.display = isVisible ? 'none' : 'block';
        showDetailsButton.textContent = isVisible ? 'Show Details' : 'Hide Details';
      });

      buildsContainer.appendChild(buildCard);
    });
  }

  // Fetch builds data
  if (buildsContainer) {
    fetch('HearthStoneData.json')
      .then(response => response.json())
      .then(data => {
        displayBuilds(data.builds);
      })
      .catch(error => console.error('Error fetching builds:', error));
  }
});
