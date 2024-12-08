const clientId = "c681eed5c74c4898a88641753ebdd9a2";
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

const localToken = localStorage.getItem("token");
const localTokenExpire = parseInt(localStorage.getItem("token_expired"), 10);

if (localToken && localTokenExpire && Date.now() < localTokenExpire) {
    const profile = await fetchProfile(localToken);
    populateUI(profile);
    const artists = await fetchFollowedArtists(localToken);
    displayFollowedArtists(artists);
} else if (code) {
    const accessToken = await getAccessToken(clientId, code);
    const profile = await fetchProfile(accessToken);
    populateUI(profile);
    const artists = await fetchFollowedArtists(accessToken);
    displayFollowedArtists(artists);
} else {
    redirectToAuthCodeFlow(clientId);
}

async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("scope", "user-read-private user-read-email user-follow-read user-modify-playback-state");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

async function getAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
    });

    const { access_token, expires_in } = await result.json();

    if (!access_token || !expires_in) {
        throw new Error("La réponse ne contient pas un token valide !");
    }

    const expirationTime = Date.now() + expires_in * 1000;
    localStorage.setItem("token", access_token);
    localStorage.setItem("token_expired", expirationTime);

    return access_token;
}

async function fetchProfile(token) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!result.ok) {
        if (result.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("token_expired");
            document.location = "http://localhost:5173";
        }
        throw new Error("Impossible de récupérer le profil utilisateur.");
    }

    return await result.json();
}

function populateUI(profile) {
    document.getElementById("displayName").innerText = profile.display_name;
    if (profile.images && profile.images.length > 0) {
        const profileImage = new Image(200, 200);
        profileImage.src = profile.images[0].url;
        document.getElementById("avatar").appendChild(profileImage);
        document.getElementById("imgUrl").innerText = profile.images[0].url;
    }
    document.getElementById("id").innerText = profile.id;
    document.getElementById("email").innerText = profile.email;
    document.getElementById("uri").innerText = profile.uri;
    document.getElementById("uri").setAttribute("href", profile.external_urls.spotify);
    document.getElementById("url").innerText = profile.href;
    document.getElementById("url").setAttribute("href", profile.href);
}

async function fetchFollowedArtists(token) {
    const response = await fetch("https://api.spotify.com/v1/me/following?type=artist", {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        throw new Error("Impossible de récupérer les artistes suivis.");
    }

    const data = await response.json();
    return data.artists.items;
}

function displayFollowedArtists(artists) {
    const container = document.getElementById("artistsContainer");
    container.innerHTML = "";

    artists.forEach(artist => {
        const artistDiv = document.createElement("div");
        artistDiv.className = "artist-item";

        const img = document.createElement("img");
        img.src = artist.images[0]?.url || "default-artist.png";
        artistDiv.appendChild(img);

        const name = document.createElement("p");
        name.textContent = artist.name;
        artistDiv.appendChild(name);

        const link = document.createElement("a");
        link.href = artist.external_urls.spotify;
        link.textContent = "Voir sur Spotify";
        link.target = "_blank";
        artistDiv.appendChild(link);

        container.appendChild(artistDiv);
    });
}

async function searchTracks(token, query) {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        throw new Error("Erreur lors de la recherche.");
    }

    const data = await response.json();
    return data.tracks.items;
}

function displaySearchResults(tracks, token) {
    const container = document.getElementById("searchResults");
    container.innerHTML = "";

    tracks.forEach(track => {
        const trackDiv = document.createElement("div");
        trackDiv.className = "track-item";

        const img = document.createElement("img");
        img.src = track.album.images[0]?.url || "default-track.png";
        trackDiv.appendChild(img);

        const name = document.createElement("p");
        name.textContent = `${track.name} by ${track.artists.map(artist => artist.name).join(", ")}`;
        trackDiv.appendChild(name);

        const playButton = document.createElement("button");
        playButton.textContent = "Lire";
        playButton.addEventListener("click", () => playTrack(token, track.uri));
        trackDiv.appendChild(playButton);

        container.appendChild(trackDiv);
    });
}

async function playTrack(token, trackUri) {
    const response = await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [trackUri] }),
    });

    if (!response.ok) {
        throw new Error("Impossible de lire la piste.");
    }

    alert("Lecture démarrée !");
}

document.getElementById("searchButton").addEventListener("click", async () => {
    const query = document.getElementById("searchInput").value;
    const tracks = await searchTracks(localToken, query);
    displaySearchResults(tracks, localToken);
});



