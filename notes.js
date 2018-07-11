/* 
    For new heroes, need to do:
        {
            "Question": "Which hero has the title of \"Black Tortoise\"?",
            "Answer": "Twenty-fifth Bam"
        },
        {
            "Question": "What is the title of Jinyo?",
            "Answer": "Black Tortoise"
        },
        {
            "Question": "What type of advantage does Jinyo have? (Rock/Paper/Scissors)",
            "Answer": "Rock"
        },
        {
            "Question": "What is the name of this hero? https://i.imgur.com/mr5xSVr.png",
            "Answer": "Jinyo"
        },
*/
/*
for (let i = 0; i < heroDataTable.length; i++) {
    if (heroDataTable[i]["Name"] !== "") {
        const heroName = heroDataTable[i]["Name"];
        const heroStat = heroDataTable[i]["advantage"];
        const trivia = `{\n\t"Question": "What type of advantage does ${heroName} have? (Rock/Paper/Scissors)",\n\t"Answer": "${heroStat}"\n},\n`;
        //console.log(trivia);
        fs.appendFile("data.txt", trivia);
    }
}
*/