export const generateAvatarFromName = fullName => {
    const backgroundColors = [
        '1abc9c',
        '2ecc71',
        '3498db',
        '9b59b6',
        '34495e',
        '16a085',
        '27ae60',
        '2980b9'
    ];

    const bgColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)];

    // Using UI Avatars - a free service that generates avatars on the fly
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&size=256&background=${bgColor}&color=ffffff&bold=true`;
};
