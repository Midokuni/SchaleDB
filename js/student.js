$.holdReady(true)

const starscale_hp      = [1, 1.05,  1.12,  1.21,  1.35 ]
const starscale_attack  = [1, 1.1,   1.22,  1.36,  1.53 ]
const starscale_healing = [1, 1.075, 1.175, 1.295, 1.445]
const school_longname = {"Abydos": "Abydos High School", "Gehenna": "Gehenna Academy", "Hyakkiyako": "Allied Hyakkiyako Academy", "Millennium": "Millennium Science School", "RedWinter": "Red Winter Federal Academy", "Shanhaijing": "Shanhaijing Senior Secondary School", "Trinity": "Trinity General School", "Valkyrie": "Valkyrie Police School", "Arius": "Arius Satellite School", "Others": "Others"}

const terrain_dmg_bonus = {D: 0.8, C: 0.9, B: 1, A: 1.1, S: 1.2, SS: 1.3}
const terrain_block_bonus = {D: 0, C: 15, B: 30, A: 45, S: 60, SS: 75}


const skill_ex_upgrade_credits = [80000, 500000, 3000000, 10000000]
const skill_upgrade_credits = [5000, 7500, 60000, 90000, 300000, 450000, 1500000, 2400000, 4000000]

const stat_friendlyname = {
    "maxhp": "Max HP",
    "attack_power": "Attack",
    "defense_power": "Defense",
    "heal_power": "Healing",
    "maxhp_percent": "Max HP",
    "attack_power_percent": "Attack",
    "heal_power_percent": "Healing",
    "accuracy": "Accuracy",
    "critical": "Critical Rate",
    "critical_damage": "Critical Damage",
    "healing_received": "Recovery Rate",
    "cc_power_percent": "CC Power",
    "cc_resist_percent": "CC Resistance",
    "critical_resist": "Critical Res.",
    "critical_damage_resist": "Critical Dmg. Res."
}

var data = {}
const json_list = {
    common: "./data/common.json",
    students: "./data/students.json"
}

loadJSON(json_list, function(result) {
    data = result
    $.holdReady(false)
})

var student, region, regionID, student_bondalts
var studentSelectorModal, statPreviewModal
var header
var stat_preview_stars = 3
var stat_preview_weapon_stars = 1

var search_options = {
    "groupby": "none",
    "sortby": "name"
}

$(document).ready(function() {
    studentSelectorModal = new bootstrap.Modal(document.getElementById("modStudents"), {})
    statPreviewModal = new bootstrap.Modal(document.getElementById("modStatPreviewSettings"), {})
    header = $(".card-header")

    hookTooltips()

    // document.getElementById("modStudents").addEventListener('shown.bs.modal', function (event) {
    //     if (window.matchMedia('(min-width: 768px)').matches) {
    //         $('#ba-student-search-text').focus()
    //     }
    // })
  
    var urlVars = new URL(window.location.href).searchParams

    if (localStorage.getItem("region")) {
        loadRegion(localStorage.getItem("region"))
    } else {
        loadRegion(0)
    }

    $("#ba-navbar-placeholder").load('nav.html', function() {
        $("#ba-navbar-link-students").addClass('active')
        $(`#ba-navbar-regionselector-${regionID}`).addClass("active")
        $("#ba-navbar-regionselector-label").text(region.name)
    })

    $(window).on('popstate', function() {
        var urlVars = new URL(window.location.href).searchParams
        loadStudent(urlVars.get("chara"))
    })

    if (urlVars.has("chara")) {
        loadStudent(urlVars.get("chara"))
    } else if (localStorage.getItem("chara")) {
        loadStudent(localStorage.getItem("chara"))
    } else {
        loadStudent("Aru")
    }

    if (localStorage.getItem("chara_groupby")) {
        searchOptionSet('groupby', localStorage.getItem("chara_groupby"), false)
    } else {
        searchOptionSet('groupby', 'none', false)
    }

    if (localStorage.getItem("chara_sortby")) {
        searchOptionSet('sortby', localStorage.getItem("chara_sortby"), false)
    } else {
        searchOptionSet('sortby', 'name', false)
    }

    populateStudentList()

    window.setTimeout(function(){$("#loading-cover").fadeOut()},500)

    $('input[type=range]').trigger('oninput')

    window.addEventListener('scroll', _.throttle(function () {
        if (((header.offset().top - $(this).scrollTop()) <= 56) != header.hasClass("stuck"))
        header.toggleClass("stuck", (header.offset().top - $(this).scrollTop()) <= 56);
    }, 100));


})

function toggleDarkTheme() {
    $('body').toggleClass("theme-dark")
}

function hookTooltips() {
    //hook bs tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))

    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    })
}

function populateStudentList() {
    
    var grouping = search_options["groupby"]
    var sortfunction

    switch (search_options["sortby"]) {
        case "default":
            sortfunction = ((a,b) => a.default_order - b.default_order)
            break
        case "name":
            sortfunction = ((a,b) => a.name_en.localeCompare(b.name_en))
            break
        case "rarity":
            sortfunction = ((a,b) => b.stars - a.stars)
            break
        case "school":
            sortfunction = ((a,b) => a.school.localeCompare(b.school))
            break
        case "role":
            sortfunction = ((a,b) => a.role.localeCompare(b.role))
            break
        case "weapon":
            sortfunction = ((a,b) => a.weapon_type.localeCompare(b.weapon_type))
            break
        case "attacktype":
            sortfunction = ((a,b) => a.attack_type.localeCompare(b.attack_type))
            break
        case "defensetype":
            sortfunction = ((a,b) => a.defense_type.localeCompare(b.defense_type))
            break
        case "attack":
            sortfunction = ((a,b) => b.attack_power_100 - a.attack_power_100)
            break
        case "defense":
            sortfunction = ((a,b) => b.defense_power_100 - a.defense_power_100)
            break
        case "maxhp":
            sortfunction = ((a,b) => b.maxhp_100 - a.maxhp_100)
            break
        case "healing":
            sortfunction = ((a,b) => b.heal_power_100 - a.heal_power_100)
            break
        case "crit":
            sortfunction = ((a,b) => b.critical - a.critical)
            break
        case "stability":
            sortfunction = ((a,b) => b.stability - a.stability)
            break
        case "accuracy":
            sortfunction = ((a,b) => b.accuracy - a.accuracy)
            break
        case "evasion":
            sortfunction = ((a,b) => b.evasion - a.evasion)
            break
    }

    var groupedResults = {}, searchTerm = $('#ba-student-search-text').val()
    switch (grouping) {
        case "none":
            groupedResults = {"All": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults["All"].push(el)
            })
            break
        case "school":
            groupedResults = {"Abydos": [], "Gehenna": [], "Hyakkiyako": [], "Millennium": [], "RedWinter": [], "Shanhaijing": [], "Trinity": [], "Valkyrie": [], "Others": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults[el.school].push(el)
            })
            break
        case "weapon":
            groupedResults = {"SG": [], "SMG": [], "AR": [], "GL": [], "HG": [], "SR": [], "RG": [], "MG": [], "MT": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults[el.weapon_type].push(el)
            })
            break
        case "rarity":
            groupedResults = {"_3": [], "_2": [], "_1": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults['_'+el.stars.toString()].push(el)
            })
            break
        case "role":
            groupedResults = {"Tank": [], "Attacker": [], "Healer": [], "Support": [], "TacticalSupport": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults[el.role].push(el)
            })
            break
        case "class":
            groupedResults = {"Striker": [], "Special": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults[el.type].push(el)
            })
            break
        case "position":
            groupedResults = {"Front": [], "Middle": [], "Back": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults[el.position].push(el)
            })
            break
        case "attacktype":
            groupedResults = {"Explosive": [], "Piercing": [], "Mystic": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults[el.attack_type].push(el)
            })
            break
        case "defensetype":
            groupedResults = {"Light": [], "Heavy": [], "Special": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults[el.defense_type].push(el)
            })
            break
        case "excost":
            groupedResults = {"_2": [], "_3": [], "_4": [], "_5": [], "_6": [], "_7": [], "_10": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults['_'+el.skill_ex_cost[4]].push(el)
            })
            break
        case "limited":
            groupedResults = {"_0": [], "_1": [], "_2": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults['_'+el.is_limited].push(el)
            })
            break
        case "urbanpower":
            groupedResults = {"S": [], "A": [], "B": [], "C": [], "D": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults[el.urban_adaption].push(el)
            })
            break
        case "outdoorpower":
            groupedResults = {"S": [], "A": [], "B": [], "C": [], "D": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults[el.outdoor_adaption].push(el)
            })
            break
        case "indoorpower":
            groupedResults = {"S": [], "A": [], "B": [], "C": [], "D": []}
            $.each(data.students, function(i, el){
                if ((el["released"][regionID]) && (searchTerm == "" || el["name_en"].toLowerCase().includes(searchTerm.toLowerCase())))
                groupedResults[el.indoor_adaption].push(el)
            })
            break
    }

    $("#ba-student-search-results").empty()

    var resultsHTML = ''

    $.each(groupedResults, function(key, val){
        
        var groupIcon, groupName, groupIconStyle

        switch (grouping) {
            case "none":
                groupIcon = ''
                groupIconStyle= ''
                groupName = key
                break
            case "school":
                groupIcon = `images/schoolicon/School_Icon_${key.toUpperCase()}.png`
                groupIconStyle= 'height:40px; width: auto; margin-bottom: -2px;'
                groupName = school_longname[key]
                break
            case "weapon":
                groupIcon = `images/weapontype/Weapon_Icon_${key.toUpperCase()}.png`
                groupIconStyle= 'height:38px; width: auto; margin-bottom: 4px;'
                groupName = key
                break
            case "rarity":
                groupIcon = `images/ui/Star${key}.png`
                groupIconStyle= 'height:26px; width: auto; margin-bottom: 1px;'
                groupName = ""
                break
            case "role":
                groupIcon = `images/tactical/Role_${key}.png`
                groupIconStyle= 'height:34px; width: auto;'
                groupName = key.replace("TacticalSupport", "Tactical Support")
                break
            case "class":
                groupIcon = `images/ui/Class_${key}.png`
                groupIconStyle= 'height: 18px; width: 80px;'
                groupName = ""
                break
            case "position":
                groupIcon = ''
                groupIconStyle= ''
                groupName = key
                break
            case "attacktype":
                groupIcon = 'images/tactical/StrategyObjectBuff_Attack.png'
                groupIconStyle = 'height:26px; width: auto; margin-bottom: 1px; filter: brightness(0%);'
                groupName = key
                break
            case "defensetype":
                groupIcon = 'images/tactical/StrategyObjectBuff_Defense.png'
                groupIconStyle = 'height:26px; width: auto; margin-bottom: 1px; filter: brightness(0%);'
                groupName = key
                break
            case "excost":
                groupIcon = 'images/ui/Image_Cost_Font.png'
                groupIconStyle = 'height: 16px; width: 56px; margin-bottom: 5px; margin-top: 7px;'
                groupName = key.substr(1)
                break
            case "limited":
                groupIcon = ''
                groupIconStyle = ''
                groupName = key.replace("_0", "Not Limited").replace("_1", "Limited Recruitment").replace("_2", "Event Reward")
                break
            case "urbanpower":
                groupIcon = `images/tactical/Ingame_Emo_Adaptresult${key}.png`
                groupIconStyle = 'height:28px; width: auto;'
                groupName = `Urban Combat Power ${key}`
                break
            case "outdoorpower":
                groupIcon = `images/tactical/Ingame_Emo_Adaptresult${key}.png`
                groupIconStyle = 'height:28px; width: auto;'
                groupName = `Outdoor Combat Power ${key}`
                break
            case "indoorpower":
                groupIcon = `images/tactical/Ingame_Emo_Adaptresult${key}.png`
                groupIconStyle = 'height:28px; width: auto;'
                groupName = `Indoor Combat Power ${key}`
                break
        }

        if (groupedResults[key].length != 0) {
            if (grouping == 'none') {
                resultsHTML = `<div class="d-flex flex-row justify-content-center">
                <ul class="ba-student-searchresult-grid align-top">
                `
                groupedResults[key].sort(sortfunction)
                $.each(groupedResults[key], function(i2, el2){
                    resultsHTML += getStudentListCardHTML(el2)
                })
                resultsHTML +=
                    `
                    </ul>
                    </div>
                    `
            } else {
                resultsHTML += `
                <div class="ba-student-search-group">
                <div class="d-flex flex-row align-items-center justify-content-center ba-student-search-group-header ${grouping == "attacktype" || grouping == "defensetype" || grouping == "class" ? 'ba-student-search-group-'+key.toLowerCase() : ''}">`
                if (groupIcon != '') {resultsHTML += `<img class="d-inline-block align-self-center me-2" src="${groupIcon}" style="${groupIconStyle}">`}
                if (groupName != '') {resultsHTML += `<p style="font-size: larger; font-weight: bold; margin-bottom: 0px;">${groupName}</p>`}
                resultsHTML += `</div>
                <div class="d-flex flex-row justify-content-center">
    
                <ul class="ba-student-searchresult-grid align-top">
                `
                groupedResults[key].sort(sortfunction)
                $.each(groupedResults[key], function(i2, el2){
                    resultsHTML += getStudentListCardHTML(el2)
                })
    
                resultsHTML +=
                `
                </ul></div></div>
                `
            }
        }
    }) 

    if (resultsHTML == '') {
        resultsHTML += `<div class="d-flex flex-row align-items-center justify-content-center">No results.</div>`
    }

    $("#ba-student-search-results").append(resultsHTML)
    
}

function searchOptionSet(option, value, runSearch = true) {
    $(`#ba-student-search-${option} a`).removeClass("active")
    $(`#ba-student-search-${option}-${value}`).addClass("active")
    $(`#ba-student-search-${option}-label`).text($(`#ba-student-search-${option}-${value}`).text())
    search_options[option] = value
    localStorage.setItem(`chara_${option}`, value)
    if (runSearch) {
        populateStudentList()  
    }
}

function loadStudent(studentName) {

    student = find(data.students,"name_dev",studentName)

    if (student.length == 1) {
        console.log(student[0])
        student = student[0]

        $('#ba-student-img').attr('src', 'images/student/' + student.student_img)
        $('#ba-student-img-sm').attr('src', 'images/student/' + student.student_img)
        
        var bgimg = new Image()
        bgimg.onload = function(){
            $("#ba-student-background").css('background-image', `url('${bgimg.src}')`)
        }
        bgimg.src = `images/background/${student.background_img}.jpg`

        $('#ba-student-name').html(student.name_en.replace('(', '<small>(').replace(')', ')</small>'))
        //$('#ba-student-name-jp').text(student.name_jp)
        $("#ba-student-class").attr("src", `images/ui/Class_${student.type}.png`)

        $("#ba-student-limited").removeClass("ba-type-striker ba-type-special")
        switch (student.is_limited) {
            case 0:
                $("#ba-student-limited").hide()
                $('#ba-student-limited-sep').hide()
                break;
            case 1:
                $("#ba-student-limited").show()
                $('#ba-student-limited-sep').show()
                $("#ba-student-limited").addClass("ba-type-striker")
                $("#ba-student-limited").text("LIM")
                $("#ba-student-limited").tooltip('dispose').tooltip({title: getRichTooltip(null, 'Limited Recruitment', null, 'Student only available for a limited time through a recruitment banner.'), placement: 'top', html: true})
                break;
            case 2:
                $("#ba-student-limited").show()
                $('#ba-student-limited-sep').show()
                $("#ba-student-limited").addClass("ba-type-special")
                $("#ba-student-limited").text("EVT")
                $("#ba-student-limited").tooltip('dispose').tooltip({title: getRichTooltip(null, 'Event Reward', null, 'Student only available for a limited time as an event reward.'), placement: 'top', html: true})
                break;
        }
        

        $("#ba-student-role-label").text(student.role.replace("TacticalSupport", "T.S."))
        $("#ba-student-role-icon").attr("src", `images/tactical/Role_${student.role}.png`)

        if (student.attack_type == "Explosive") {
            $("#ba-student-attacktype").removeClass("ba-type-mystic ba-type-pierce").addClass("ba-type-explosive")
            $(".ba-skill").removeClass("ba-skill-yellow ba-skill-blue").addClass("ba-skill-red")
        } else if (student.attack_type == "Piercing") {
            $("#ba-student-attacktype").removeClass("ba-type-mystic ba-type-explosive").addClass("ba-type-pierce")
            $(".ba-skill").removeClass("ba-skill-red ba-skill-blue").addClass("ba-skill-yellow")
        } else if (student.attack_type == "Mystic") {
            $("#ba-student-attacktype").removeClass("ba-type-pierce ba-type-explosive").addClass("ba-type-mystic")
            $(".ba-skill").removeClass("ba-skill-yellow ba-skill-red").addClass("ba-skill-blue")
        }

        if (student.defense_type == "Light") {
            $("#ba-student-defensetype").removeClass("ba-type-mystic ba-type-pierce").addClass("ba-type-explosive")
        } else if (student.defense_type == "Heavy") {
            $("#ba-student-defensetype").removeClass("ba-type-mystic ba-type-explosive").addClass("ba-type-pierce")
        } else if (student.defense_type == "Special") {
            $("#ba-student-defensetype").removeClass("ba-type-pierce ba-type-explosive").addClass("ba-type-mystic")
        }
        
        $("#ba-student-school-label").text(student.school)
        $("#ba-student-school-img").attr("src", "images/schoolicon/School_Icon_" + student.school.toUpperCase().replace(" ","") + ".png")
        //$('#ba-student-school-img').tooltip('dispose').tooltip({title: school_longname[student.school], placement: 'bottom'})
        $("#ba-student-position").text(student.position.toUpperCase())
        $("#ba-student-attacktype-label").text(student.attack_type)
        $('#ba-student-attacktype').tooltip('dispose').tooltip({title: getRichTooltip("images/tactical/StrategyObjectBuff_Attack.png", `${student.attack_type}`, 'Attack Type', getTypeText(student.attack_type)), placement: 'top', html: true})
        $("#ba-student-defensetype-label").text(student.defense_type)
        $('#ba-student-defensetype').tooltip('dispose').tooltip({title: getRichTooltip("images/tactical/StrategyObjectBuff_Defense.png", `${student.defense_type}`, 'Defense Type', getTypeText(student.defense_type)), placement: 'top', html: true})

        recalculateTerrainAffinity()

        if (student.uses_cover) {
            $("#ba-student-usescover-icon").show()
        } else {
            $("#ba-student-usescover-icon").hide()
        }

        $("#ba-student-weapontype-label").text(student.weapon_type)
        $(".ba-type-weapon").css("background-image", "url('images/weapontype/Weapon_Icon_" + student.weapon_type_img + ".png')")

        $("#ba-student-stars").attr("src", "images/ui/Star_" + student.stars + ".png")

        $("#ba-student-gear-1").attr("src", "images/equipment/Equipment_Icon_" + student.gear_1 + "_Tier1.png")
        $("#ba-student-gear-2").attr("src", "images/equipment/Equipment_Icon_" + student.gear_2 + "_Tier1.png")
        $("#ba-student-gear-3").attr("src", "images/equipment/Equipment_Icon_" + student.gear_3 + "_Tier1.png")
        $('#ba-student-gear-1').tooltip('dispose').tooltip({title: getRichTooltip(null, student.gear_1, 'Gear', find(data.common.gear, "type", student.gear_1)[0].description), placement: 'top', html: true})
        $('#ba-student-gear-2').tooltip('dispose').tooltip({title: getRichTooltip(null, student.gear_2, 'Gear', find(data.common.gear, "type", student.gear_2)[0].description), placement: 'top', html: true})
        $('#ba-student-gear-3').tooltip('dispose').tooltip({title: getRichTooltip(null, student.gear_3, 'Gear', find(data.common.gear, "type", student.gear_3)[0].description), placement: 'top', html: true})

        //Skills
        $("#ba-skill-ex-name").text(student.skill_ex_name_en ? student.skill_ex_name_en : student.skill_ex_name_jp)
        $("#ba-skill-normal-name").text(student.skill_normal_name_en ? student.skill_normal_name_en : student.skill_normal_name_jp)
        $("#ba-skill-passive-name").text(student.skill_passive_name_en ? student.skill_passive_name_en : student.skill_passive_name_jp)
        $("#ba-skill-sub-name").text(student.skill_sub_name_en ? student.skill_sub_name_en : student.skill_sub_name_jp)     

        $('#ba-skill-ex-icon').attr("src", "images/skill/" + student.skill_ex_icon)
        $('#ba-skill-normal-icon').attr("src", "images/skill/" + student.skill_normal_icon)
        $('#ba-skill-passive-icon').attr("src", "images/skill/" + student.skill_passive_icon)
        $('#ba-skill-sub-icon').attr("src", "images/skill/" + student.skill_sub_icon)

        student.skill_ex_cost[0] == student.skill_ex_cost[4] ? $("#ba-skill-ex-cost").removeClass("ba-skill-emphasis") : $("#ba-skill-ex-cost").addClass("ba-skill-emphasis")

        //Weapon
        $("#ba-student-weapon-name").text(student.weapon_name_en ? student.weapon_name_jp: student.weapon_name_jp)
        $("#ba-student-weapon-type").text(student.weapon_type)
        //$("#ba-statpreview-weapon-name").text(student.weapon_name_en)
        //$("#ba-weapon-name-jp").text(student.weapon_name_jp)
        $("#ba-student-weapon-img").attr("src", `images/weapon/Weapon_Icon_${student.id}.png`)
        //$("#ba-statpreview-weapon-img").attr("src", `images/weapon/Weapon_Icon_${student.id}.png`)

        if (student.weapon_skill_passive_description != null) {
            $("#ba-weapon-skill-passive-name").text(student.skill_passive_name_en ? student.skill_passive_name_en + '＋' : student.skill_passive_name_jp + '＋')
            $('#ba-weapon-skill-passive-icon').attr("src", "images/skill/" + student.skill_passive_icon)
            recalculateWeaponSkillPreview()
        }

        $('#ba-weapon-bonus-terrain-type').attr("src", `images/tactical/Terrain_${student.weapon_bonus_terrain_type}.png`)
        $('#ba-weapon-bonus-terrain-adaption').attr("src", `images/tactical/Ingame_Emo_Adaptresult${student.weapon_bonus_terrain_adaption}.png`)
        $('#ba-weapon-bonus-terrain-adaption-description').html(`${student.weapon_bonus_terrain_type.charAt(0).toUpperCase()+student.weapon_bonus_terrain_type.substr(1)} Combat Power ${eval('student.'+student.weapon_bonus_terrain_type+'_adaption')} → <b>${student.weapon_bonus_terrain_adaption}</b><br>(${getAdaptionText(student.weapon_bonus_terrain_type, student.weapon_bonus_terrain_adaption)})`)

        var url = new URL(window.location.href)

        if (url.searchParams.get("chara") !== student.name_dev) {
            url.searchParams.set("chara", student.name_dev)
            history.pushState(null, '', url)
        }
        
        $.each(student.weapon_bonus_stats, function(i, el) {
            $(`#ba-weapon-stat-${i+1}`).text(getStatName(student.weapon_bonus_stats[i]))
            $(`#ba-weapon-stat-${i+1}-amount`).text(student.weapon_bonus_stats_parameters[i][0])
        }) 

        if (student.weapon_bonus_stats.length > 2) {
            $('#ba-weapon-stat-row2').show()
        } else {
            $('#ba-weapon-stat-row2').hide()
        }

        if (student.weapon_description_en) {
            $('#ba-weapon-description').text(student.weapon_description_en)
        } else if (student.weapon_description_jp) {
            $('#ba-weapon-description').text(student.weapon_description_jp)
        } else {
            $('#ba-weapon-description').text("")
        }       

        //Profile
        $('#ba-student-fullname-en').text(student.fullname_en)
        $('#ba-student-fullname-jp').text(student.fullname_jp)
        $("#ba-profile-school-img").attr("src", "images/schoolicon/School_Icon_" + student.school.toUpperCase().replace(" ","") + ".png")
        $('#ba-student-schoolclub-label').text(`${school_longname[student.school]} / ${student.club_en}`)

        if (student.profile_en) {
            $('#ba-student-profile-text').text(student.profile_en)
        } else if (student.profile_jp) {
            $('#ba-student-profile-text').text(student.profile_jp)
        } else {
            $('#ba-student-profile-text').text("")
        }  

        if (student.recollection_lobby) {
            $(".ba-student-lobby").show()
            $("#ba-student-lobby-img").attr("src", `images/student/lobby/Lobbyillust_Icon_${student.name_dev}_01_Small.png`)
            $("#ba-student-lobby-unlock").text(student.recollection_lobby)
            $(".ba-student-lobby").tooltip('dispose').tooltip({title: getRichTooltip(null, 'Recollection Lobby', null, `Unlocks after affection rank ♥${student.recollection_lobby}`), placement: 'top', html: true})
        } else {
            $(".ba-student-lobby").hide()
        }
        
        $('#ba-student-profile-age').text(student.age)
        $('#ba-student-profile-birthday').text(student.birthday)
        $('#ba-student-profile-hobbies').text(student.hobbies)
        $('#ba-student-profile-height').text(student.height)
        $('#ba-student-profile-cv').text(student.cv)
        $('#ba-student-profile-illustrator').text(student.illustrator)

        var favItemsHtml = ""
        $(student.favoured_items[0]).each(function(i,el){
            favItemsHtml += getFavourIconHTML(el, 3)
        })
        $(student.favoured_items[1]).each(function(i,el){
            favItemsHtml += getFavourIconHTML(el, 2)
        })
        $('#ba-student-favoured-items').empty().html(favItemsHtml)
        if (favItemsHtml == "") {
            $('#ba-student-favoured-items').empty().html('<span class="pb-2">This student does not have any favourite gifts.</span>')
        } else {
            $('#ba-student-favoured-items').empty().html(favItemsHtml)
        }

        var favFurnitureHtml = ""
        $(student.favoured_furniture).each(function(i,el){
            favFurnitureHtml += getFurnitureIconHTML(el)
        })

        $('#ba-student-favoured-furniture').empty().html(favFurnitureHtml)
        if (favFurnitureHtml == "") {
            $('#ba-student-favoured-furniture').empty().html('<span class="pb-2">This student does not interact with any café furniture.</span>')
        } else {
            $('#ba-student-favoured-furniture').empty().html(favFurnitureHtml)
        }
        $('.ba-student-favoured-item').tooltip({html: true})

        $('#ba-student-bond-1').text(getStatName(student.bond_stat[0]))
        $('#ba-student-bond-2').text(getStatName(student.bond_stat[1]))

        if (student.type == "Striker") {
            $('#ba-student-stat-table').removeClass("table-striker-bonus")
            $('#ba-student-stat-striker-bonus').hide()
        } else {
            $('#ba-student-stat-striker-bonus').show()
        }
        
        $('#ba-statpreview-bond-targets').empty().html(getBondTargetsHTML(1, student))
        student_bondalts = []
        for (let i = 0; i < student.bond_extratarget.length; i++) {
            var extraTarget = find(data.students,"id",student.bond_extratarget[i])[0]
            if (extraTarget.released[regionID]) {
                student_bondalts.push(extraTarget)
                $('#ba-statpreview-bond-targets').append('<div style="border-top: lightgrey 1px solid; min-width: 100%"></div>'+getBondTargetsHTML(1 + student_bondalts.length, extraTarget))
            }
        }

        document.title = `Schale DB | ${student.name_en}`

        changeStatPreviewStars(student.stars)
        recalculateWeaponPreview()
        recalculateStatPreview()
        recalculateSkillPreview()
        recalculateEXSkillPreview()
        recalculateBondPreview()

        changeGearLevel(1, document.getElementById('ba-statpreview-gear1-range'))
        changeGearLevel(2, document.getElementById('ba-statpreview-gear2-range'))
        changeGearLevel(3, document.getElementById('ba-statpreview-gear3-range'))

        for (let i = 1; i <= student_bondalts.length+1; i++) {
            changeStatPreviewBondLevel(i, document.getElementById(`ba-statpreview-bond-${i}-range`))
        }
        //changeStatPreviewWeaponLevel(document.getElementById(`ba-statpreview-weapon-range`))
        
        localStorage.setItem("chara", student.name_dev)
        studentSelectorModal.hide()
    }
}

function changeRegion(regID) {
    regionID = regID
    localStorage.setItem("region", regionID)
    if (!student.released[regionID]) {
        localStorage.setItem("chara", "Aru")
        location.href = "students.html?chara=Aru"
    } else {
        location.reload()
    }
}

function loadRegion(regID) {
    regionID = regID
    region = data.common.regions[regionID]
    $("#ba-statpreview-levelrange").attr("max",region.studentlevel_max)
    $("#ba-weaponpreview-levelrange").attr("max",region.weaponlevel_max)
    if (region.weaponlevel_max == 0) {
        $("#ba-student-nav-weapon").hide()
        $("#ba-statpreview-includeweapon-container").hide()
        $("#ba-statpreview-includeweapon").prop("checked",false)
    }
    $("#ba-bond-levelrange").attr("max",region.bondlevel_max)
    $("#ba-statpreview-gear1-range").attr("max",region.gear1_max)
    $("#ba-statpreview-gear2-range").attr("max",region.gear2_max)
    $("#ba-statpreview-gear3-range").attr("max",region.gear3_max)
}

function getAdaptionText(terrain, rank) {
    return `Deals <b>${terrain_dmg_bonus[rank]}&times;</b> damage in <b>${terrain}</b> terrain.\nBlock rate when taking cover <b>+${terrain_block_bonus[rank]}%</b>.\nChance to ignore block <b>+${terrain_block_bonus[rank]}%</b>.`
}

function getStatName(stat) {
    return stat_friendlyname[stat]
}

function getFormattedStatAmount(val) {
    return Number.isInteger(val) ? val : `${parseFloat((val*100).toFixed(2))}%`
}

function changeGearLevel(slot, el) {
    var geartype = eval('student.gear_'+slot)
    var gearobj = find(data.common.gear, "type", geartype)[0]
    $(`#ba-statpreview-gear${slot}-icon`).attr("src", `images/equipment/Equipment_Icon_${geartype}_Tier${el.value}.png`)
    $(`#ba-statpreview-gear${slot}-level`).text(`T${el.value}`)
    $(`#ba-statpreview-gear${slot}-name`).text(`${gearobj.items[el.value-1].name_en}`)
    var desc = ""
    $(gearobj.items[el.value-1].bonus_stats).each(function(i){
        desc += `${getStatName(gearobj.items[el.value-1].bonus_stats[i])} <b>+${getFormattedStatAmount(gearobj.items[el.value-1].bonus_stats_parameters[i][1])}</b>, `
    })
    $(`#ba-statpreview-gear${slot}-description`).html(desc.substring(0, desc.length-2))
    if ($('#ba-statpreview-includegear').prop('checked')) {
        recalculateStatPreview()
    }    
}

function toggleStrikerBonus(el) {
    var active = $(el).hasClass("active")

    $('#ba-student-stat-table').toggleClass("table-striker-bonus")
    recalculateStatPreview()
}

function changeStatPreviewLevel(el) {
    $('#ba-statpreview-level').text("Lv." + el.value)
    recalculateStatPreview()
}

function changeSkillPreviewLevel(el) {
    if (el.value == el.max) {
        $('#ba-skill-level').html(`<img src="images/ui/ImageFont_Max.png" style="height: 18px;width: auto;margin-top: -3px;">`)
    } else {
        $('#ba-skill-level').html("Lv." + el.value)
    }
    recalculateSkillPreview()
}

function changeWeaponSkillPreviewLevel(el) {
    if (el.value == el.max) {
        $('#ba-weapon-skill-level').html(`<img src="images/ui/ImageFont_Max.png" style="height: 18px;width: auto;margin-top: -3px;">`)
    } else {
        $('#ba-weapon-skill-level').html("Lv." + el.value)
    }
    recalculateWeaponSkillPreview()
}

function changeEXSkillPreviewLevel(el) {
    if (el.value == el.max) {
        $('#ba-skill-ex-level').html(`<img src="images/ui/ImageFont_Max.png" style="height: 18px;width: auto;margin-top: -3px;">`)
    } else {
        $('#ba-skill-ex-level').html("Lv." + el.value)
    }
    recalculateEXSkillPreview()
}

function changeWeaponPreviewLevel(el) {
    var imgHTML = '<img src="images/ui/Common_Icon_Formation_Star_2.png" style="height: 16px;width: auto;margin-top: -3px;"></img>'
    $('#ba-weaponpreview-level').text("Lv." + el.value)
    // if (el.value <= 30) {
    //     $('#ba-weaponpreview-level').append(imgHTML.repeat(1))
    // } else if (el.value <= 40) {
    //     $('#ba-weaponpreview-level').append(imgHTML.repeat(2))
    // } else if (el.value <= 50) {
    //     $('#ba-weaponpreview-level').append(imgHTML.repeat(3))
    // }
    recalculateWeaponPreview()
}

function changeStatPreviewBondLevel(i, el) {
    var imgHTML = '<img src="images/ui/School_Icon_Schedule_Favor.png" style="height:24px; width:auto; margin-top: -3px; margin-left: -2px;">'
    $(`#ba-statpreview-bond-${i}-level`).html(imgHTML + el.value)
    var bondStats
    if (i == 1) {
        bondStats = Object.entries(getBondStats(student, el.value))
    } else {
        bondStats = Object.entries(getBondStats(student_bondalts[i-2], el.value))
    }
    $(`#ba-statpreview-bond-${i}-description`).html(`${getStatName(bondStats[0][0])} <b>+${getFormattedStatAmount(bondStats[0][1])}</b>, ${getStatName(bondStats[1][0])} <b>+${getFormattedStatAmount(bondStats[1][1])}</b>`)
    if ($('#ba-statpreview-includebond').prop('checked')) {
        recalculateStatPreview()
    }
}

function changeStatPreviewWeaponLevel(el) {
    var levelscale = ((((el.value*10) + 20)-1)/99).toFixed(4)
    $(`#ba-statpreview-weapon-description`).empty()
    $.each(student.weapon_bonus_stats, function(i, el) {
        $(`#ba-statpreview-weapon-description`).append(stat_friendlyname[el] + ' <b>+' + Math.round(student.weapon_bonus_stats_parameters[i][0] + (student.weapon_bonus_stats_parameters[i][1]-student.weapon_bonus_stats_parameters[i][0]) * levelscale) + '</b>')
        if (i+1 != student.weapon_bonus_stats.length) {
            $(`#ba-statpreview-weapon-description`).append(', ')
        }
    }) 

    $('#ba-statpreview-weapon-description').text()
    $('#ba-statpreview-weapon-level').html(`<img src="images/ui/Common_Icon_Formation_Star_2.png" style="height: 20px;width: auto;margin-top: -3px;margin-right:2px;"></img>${el.value}`)
    if ($('#ba-statpreview-includeweapon').prop('checked')) {
        recalculateStatPreview()
    }
}

function getBondTargetsHTML(num, student) {
    return `<div class="mt-2 d-flex flex-row align-items-center">
        <div class="me-2" style="position: relative;">
            <img class="ba-bond-icon ms-0" src="images/student/collection/Student_Portrait_${student.name_dev}_Collection.png">
        </div>
        <div class="flex-fill">
            <h5 class="d-inline">${student.name_en}</h5>
            <p id="ba-statpreview-bond-${num}-description" class="mb-0" style="font-size: 0.875rem; line-height: 1rem;"></p>
        </div>
    </div>
    <div class="d-flex flex-row align-items-center mb-2">
        <input id="ba-statpreview-bond-${num}-range" oninput="changeStatPreviewBondLevel(${num}, this)" type="range" class="form-range mx-2 flex-fill" value="${num == 1 ? 20 : 1}" min="1" max="${region.bondlevel_max}">
        <span id="ba-statpreview-bond-${num}-level" class="ba-slider-label"></span>
    </div>`
}

function changeBondLevel(el) {
    var imgHTML = '<img src="images/ui/School_Icon_Schedule_Favor.png" style="height:24px; width:auto; margin-top: -3px; margin-left: -2px;">'
    $('#ba-bond-level').html(imgHTML + el.value)
    recalculateBondPreview()
}

function recalculateTerrainAffinity() {
    var adaption = {}
    adaption["urban"] = student.urban_adaption
    adaption["outdoor"] = student.outdoor_adaption
    adaption["indoor"] = student.indoor_adaption

    if (stat_preview_stars == 5 && $('#ba-statpreview-includeweapon').prop('checked') && stat_preview_weapon_stars >= 3) {
        adaption[student.weapon_bonus_terrain_type] = student.weapon_bonus_terrain_adaption
    }

    $("#ba-student-terrain-urban-icon").attr("src", "images/tactical/Ingame_Emo_Adaptresult" + adaption["urban"] + ".png")
    $("#ba-student-terrain-outdoor-icon").attr("src", "images/tactical/Ingame_Emo_Adaptresult" + adaption["outdoor"] + ".png")
    $("#ba-student-terrain-indoor-icon").attr("src", "images/tactical/Ingame_Emo_Adaptresult" + adaption["indoor"] + ".png")
    $('#ba-student-terrain-urban').tooltip('dispose').tooltip({title: getRichTooltip(null, 'Urban Combat Power ' + adaption["urban"], null, getAdaptionText('urban', adaption["urban"])), placement: 'top', html: true})
    $('#ba-student-terrain-outdoor').tooltip('dispose').tooltip({title: getRichTooltip(null, 'Outdoor Combat Power ' + adaption["outdoor"], null, getAdaptionText('outdoor', adaption["outdoor"])), placement: 'top', html: true})
    $('#ba-student-terrain-indoor').tooltip('dispose').tooltip({title: getRichTooltip(null, 'Indoor Combat Power ' + adaption["indoor"], null, getAdaptionText('indoor', adaption["indoor"])), placement: 'top', html: true})
}

function recalculateWeaponPreview() {

    var level = $("#ba-weaponpreview-levelrange").val()

    var levelscale = ((level-1)/99).toFixed(4)

    $.each(student.weapon_bonus_stats, function(i, el) {
        $(`#ba-weapon-stat-${i+1}-amount`).text('+'+Math.round(student.weapon_bonus_stats_parameters[i][0] + (student.weapon_bonus_stats_parameters[i][1]-student.weapon_bonus_stats_parameters[i][0]) * levelscale))
    }) 

}

function recalculateStatPreview() {

    var minlevelreq = [0, 15, 35]
    var maxbond = [10, 10, 20, 20, 50]
    var strikerBonus = $('#ba-student-stat-table').hasClass("table-striker-bonus")

    var bonus = {
        "maxhp_percent": 1,
        "attack_power_percent": 1,
        "heal_power_percent": 1,
        "maxhp": 0,
        "attack_power": 0,
        "defense_power": 0,
        "heal_power": 0,
        "accuracy": 0,
        "critical": 0,
        "critical_damage": 0,
        "healing_received": 0,
        "cc_power_percent": 1,
        "cc_resist_percent": 1,
        "critical_resist": 0,
        "critical_damage_resist": 0
    }

    var level = $("#ba-statpreview-levelrange").val()
    var levelscale = ((level-1)/99).toFixed(4)

    var maxHP = Math.ceil((Math.round((student.maxhp_1 + (student.maxhp_100-student.maxhp_1) * levelscale).toFixed(4)) * starscale_hp[stat_preview_stars-1]).toFixed(4))
    var attack = Math.ceil((Math.round((student.attack_power_1 + (student.attack_power_100-student.attack_power_1) * levelscale).toFixed(4)) * starscale_attack[stat_preview_stars-1]).toFixed(4))
    var defense = Math.round((student.defense_power_1 + (student.defense_power_100-student.defense_power_1) * levelscale).toFixed(4))
    var healing = Math.ceil((Math.round((student.heal_power_1 + (student.heal_power_100-student.heal_power_1) * levelscale).toFixed(4)) * starscale_healing[stat_preview_stars-1]).toFixed(4))

    if ($('#ba-statpreview-includegear').prop('checked')) {
        var gear = []
        var tier = 1

        gear[0] = find(data.common.gear,"type",student.gear_1)[0]
        gear[1] = find(data.common.gear,"type",student.gear_2)[0]
        gear[2] = find(data.common.gear,"type",student.gear_3)[0]

        $.each(gear, function(i, el) {
            tier = $(`#ba-statpreview-gear${i+1}-range`).val()
            if (level >= minlevelreq[i]) {
                for (let j = 0; j < el.items[tier-1].bonus_stats.length; j++) {
                    bonus[el.items[tier-1].bonus_stats[j]] += el.items[tier-1].bonus_stats_parameters[j][1]    
                }
            }
        })
    }

    if ($('#ba-statpreview-includebond').prop('checked')) {
        for (let i = 1; i <= student_bondalts.length+1; i++) {
            var bondlevel = $(`#ba-statpreview-bond-${i}-range`).val()
            var bondbonus = getBondStats(i == 1 ? student : student_bondalts[i-2], i == 1 ? Math.min(maxbond[stat_preview_stars-1], bondlevel) : bondlevel)
            $.each(bondbonus, function(j, el) {bonus[j] += el})
        }
    }

    if ((stat_preview_stars == 5) && $('#ba-statpreview-includeweapon').prop('checked')) {
        var weaponlevel = (stat_preview_weapon_stars*10) + 20
        var weaponlevelscale = ((weaponlevel-1)/99).toFixed(4)
        $.each(student.weapon_bonus_stats, function(i, el) {
            bonus[student.weapon_bonus_stats[i]] += Math.round((student.weapon_bonus_stats_parameters[i][0] + (student.weapon_bonus_stats_parameters[i][1]-student.weapon_bonus_stats_parameters[i][0]) * weaponlevelscale).toFixed(4))
        }) 
    }

    if (!strikerBonus) {
        $('#ba-student-stat-maxhp').text(Math.round(((maxHP+bonus["maxhp"])*bonus["maxhp_percent"]).toFixed(4)))
        $('#ba-student-stat-attack').text(Math.round(((attack+bonus["attack_power"])*bonus["attack_power_percent"]).toFixed(4)))
        $('#ba-student-stat-defense').text(defense+bonus["defense_power"])//.tooltip('dispose').tooltip({title: `<b>${parseFloat(((1-(0.7*(Math.pow(0.99925,defense+bonus["defense_power"]))+0.3))*100).toFixed(2))}%</b> damage reduction.`, placement: 'top', html: true})
        $('#ba-student-stat-healing').text(Math.round(((healing+bonus["heal_power"])*bonus["heal_power_percent"]).toFixed(4)))
    } else {
        $('#ba-student-stat-maxhp').text('+'+Math.floor(((maxHP+bonus["maxhp"])*bonus["maxhp_percent"]).toFixed(4)*0.1))
        $('#ba-student-stat-attack').text('+'+Math.floor(((attack+bonus["attack_power"])*bonus["attack_power_percent"]).toFixed(4)*0.1))
        $('#ba-student-stat-defense').text('+'+Math.floor((defense+bonus["defense_power"])*0.05))
        $('#ba-student-stat-healing').text('+'+Math.floor(((healing+bonus["heal_power"])*bonus["heal_power_percent"]).toFixed(4)*0.05))
    }


    $('#ba-student-stat-accuracy').text(student.accuracy+bonus["accuracy"])
    $('#ba-student-stat-evasion').text(student.evasion)
    var totalcrit = student.critical+bonus["critical"]-100
    $('#ba-student-stat-crit').text(student.critical+bonus["critical"])//.tooltip('dispose').tooltip({title: `<b>${parseFloat(((totalcrit/(totalcrit+650))*100).toFixed(2))}%</b> critical chance against a target with 100 crit resistance.`, placement: 'top', html: true})
    $('#ba-student-stat-critdmg').text(`${parseFloat(((student.critical_dmg+bonus["critical_damage"])/100).toFixed(4))}%`)

    $('#ba-student-stat-stability').text(student.stability)//.tooltip('dispose').tooltip({title: `Minimum weapon damage: <b>${parseFloat(((0.015*student.stability)+55).toFixed(2))}%</b>`, placement: 'top', html: true})
    $('#ba-student-stat-range').text(student.range)
    $('#ba-student-stat-ccpower').text(`${Math.round(((100*bonus["cc_power_percent"])).toFixed(4))}`)
    $('#ba-student-stat-ccresist').text(`${Math.round(((100*bonus["cc_resist_percent"])).toFixed(4))}`)

    if (student.type == "Striker") {
        $('#ba-student-stat-ammo').text(student.ammo_count + " (" + student.ammo_cost + ")")
    } else {
        $('#ba-student-stat-ammo').text('N/A')
    }
    
    //$('#ba-student-stat-costrecovery').text(student.cost_recovery)
    $('#ba-student-stat-critresist').text(100+bonus["critical_resist"])
    $('#ba-student-stat-critdmgresist').text(`${parseFloat(((5000+bonus["critical_damage_resist"])/100).toFixed(4))}%`)
    $('#ba-student-stat-recoveryrate').text(`${parseFloat(((10000+bonus["healing_received"])/100).toFixed(4))}%`)
}

function recalculateEXSkillPreview() {
    var skillLevelEX = $("#ba-skillpreview-exrange").val()

    $('#ba-skill-ex-description').html(getSkillText(student.skill_ex_description, student.skill_ex_parameters, skillLevelEX))
    $('.ba-skill-debuff, .ba-skill-buff, .ba-skill-special, .ba-skill-cc').each(function(i,el) {
        $(el).tooltip({html: true})
    })
    $('#ba-skill-ex-materials').empty()

    if (skillLevelEX >= 2) {
        var html = ''
        $.each(student.skill_ex_upgrade_material[skillLevelEX-2], function(i, el) {
            var item = find(data.common.items,"id",el)[0]
            html += getMaterialIconHTML(item.rarity, item.icon, item.name_en, student.skill_ex_upgrade_amount[skillLevelEX - 2][i], item.type)
        })
        html += getMaterialIconHTML('N', 'Currency_Icon_Gold', 'Credits', abbreviateNumber(skill_ex_upgrade_credits[skillLevelEX - 2]), 'Item')

        $('#ba-skill-ex-materials').html(html)
        $('#ba-skill-ex-materials div').each(function(i,el) {
            $(el).tooltip({html: true})
        })
    } else {
        $('#ba-skill-ex-materials').html('<span class="pb-2">No materials required.</span>')
    }
    $('#ba-skill-ex-cost').text(student.skill_ex_cost[skillLevelEX-1])

}

function getStudentListCardHTML(student) {
    var label = ""
    switch (search_options["sortby"]) {
        case "default": case "name": case "rarity":
            label += student.name_en
            break
        case "school":
            label += student.school.replace("RedWinter", "Red Winter")
            break
        case "role":
            label += student.role.replace("TacticalSupport", "T.S.")
            break 
        case "weapon":
            label += student.weapon_type
            break
        case "attacktype":
            label += student.attack_type
            break 
        case "defensetype":
            label += student.defense_type
            break
        case "maxhp":
            label += student.maxhp_100
            break 
        case "attack":
            label += student.attack_power_100
            break
        case "defense":
            label += student.defense_power_100
            break 
        case "healing":
            label += student.heal_power_100
            break 
        case "accuracy":
            label += student.accuracy
            break 
        case "evasion":
            label += student.evasion
            break
        case "crit":
            label += student.critical
            break 
        case "stability":
            label += student.stability
            break 
    }
    var showInfo = $('#ba-student-search-showinfo').prop('checked')
    var html = `
    <li class="ba-student-searchresult-item">
        <div onclick="loadStudent('${student["name_dev"]}')" class="ba-student-card ${showInfo ? "ba-student-search-details" : ""}">
            <img class="ba-student-card-portrait" src="images/student/collection/Student_Portrait_${student["name_dev"]}_Collection.png">
            <span class="ba-student-card-role bg-${student["type"].toLowerCase()}" style="left: 0; top: 0;"><img src="images/tactical/Role_${student["role"]}.png" style="width:100%"></span>
            <span class="ba-student-card-star" style="right: 2px; top: 2px;">${student["stars"]}</span>
            <div class="d-flex align-items-center bd-${student["attack_type"].toLowerCase()} ba-student-card-label">
            `
    if (student.name_en != label) {
        html += `<span class="ba-unhover-text px-1 align-middle ${label.length > 11 ? "smalltext" : ""}" style="width: 100%">${label}</span>
        <span class="ba-hover-text px-1 align-middle ${student.name_en.length > 11 ? "smalltext" : ""}" style="width: 100%">${student.name_en}</span>`
    } else {
        html += `<span class="px-1 align-middle ${label.length > 11 ? "smalltext" : ""}" style="width: 100%">${label}</span>`
    }
    html += '</div></div></li>'
    return html
    //            <span style="z-index: 10; padding: 2px 3px; position: absolute; left: 3px; bottom: 26px; width:36px; height:12px; background-color: #ffffff; border-radius: 10px;" ><img style="width:100%; height:100%" src="images/ui/Class_${student["type"]}.png"></span>

}

function getStudentLimitedBadgeHTML(lim) {
    switch (lim) {
        case 0:
            return ''
        case 1:
            return `<span class="ba-student-card-badge" style="left: 3px; top: 26px; background-color: #f64b23; font-size: 13px;">L</span>`
        case 2:
            return `<span class="ba-student-card-badge" style="left: 3px; top: 26px; background-color: #007dff; font-size: 13px;">E</span>`
    }
}

function getMaterialIconHTML(rarity, icon, name, amount, type) {
    var html
    html = `<div class="me-2 drop-shadow" style="position: relative;" data-bs-toggle="tooltip" data-bs-placement="top" title="${getRichTooltip(null, type, rarity, name)}">
            <img class="ba-material-icon" style="background-image: url('images/ui/Card_Item_Bg_${rarity}.png');"
            src="images/items/${icon}.png"><span class="ba-material-label">&times;${amount}</span></div>
            `
    return html
}

function getFavourIconHTML(id, grade) {
    var gift = find(data.common.items, "id", 5000+id)[0]
    var html = `<div class="ba-student-favoured-item drop-shadow" style="position: relative;" data-bs-toggle="tooltip" data-bs-placement="top" title="${getRichTooltip(null, gift.type, gift.rarity, gift.name_en)}">
            <img id="ba-student-favoured-item-icon" style="background-image: url('images/ui/Card_Item_Bg_${gift.rarity}.png')" src="images/items/${gift.icon}.png">
            <img id="ba-student-favoured-item-rank" src="images/ui/Cafe_Interaction_Gift_0${grade}.png"></div>
            `
    return html
}

function getFurnitureIconHTML(id) {
    var item = find(data.common.furniture, "id", id)[0]
    var html = `<div class="ba-student-favoured-item drop-shadow" style="position: relative;" data-bs-toggle="tooltip" data-bs-placement="top" title="${getRichTooltip(null, 'Furniture', item.rarity, item.name_en)}">
    <img id="ba-student-favoured-item-icon" style="background-image: url('images/ui/Card_Item_Bg_${item.rarity}.png')" src="images/furniture/${item.icon}.png"></div>
    `
return html
}

function searchToggleInfo(obj) {
    if ($('#ba-student-search-showinfo').prop('checked')) {
        $(".ba-student-card").toggleClass('ba-student-search-details', true)
    } else {
        $(".ba-student-card").toggleClass('ba-student-search-details', false)
    }

    
}

function recalculateSkillPreview() {
    var skillLevel = $("#ba-skillpreview-range").val()

    $('#ba-skill-normal-description').html(getSkillText(student.skill_normal_description, student.skill_normal_parameters, skillLevel))
    $('#ba-skill-passive-description').html(getSkillText(student.skill_passive_description, student.skill_passive_parameters, skillLevel))
    $('#ba-skill-sub-description').html(getSkillText(student.skill_sub_description, student.skill_sub_parameters, skillLevel))

    $('.ba-skill-debuff, .ba-skill-buff, .ba-skill-special, .ba-skill-cc').each(function(i,el) {
        $(el).tooltip({html: true})
    })

    $('#ba-skill-materials').empty()
    if (skillLevel >= 2 && skillLevel < 10) {
        var html = ''
        $.each(student.skill_upgrade_material[skillLevel-2], function(i, el) {
            var item = find(data.common.items,"id",el)[0]
            html += getMaterialIconHTML(item.rarity, item.icon, item.name_en, student.skill_upgrade_amount[skillLevel - 2][i], item.type)
        })
        html += getMaterialIconHTML('N', 'Currency_Icon_Gold', 'Credits', abbreviateNumber(skill_upgrade_credits[skillLevel - 2]), 'Item')

        $('#ba-skill-materials').html(html)
        $('#ba-skill-materials div').each(function(i,el) {
            $(el).tooltip({html: true})
        })
    } else if (skillLevel == 10) {
        var html = ''
        var item = find(data.common.items,"id",9999)[0]
        html += getMaterialIconHTML(item.rarity, item.icon, item.name_en, 1, item.type)
        html += getMaterialIconHTML('N', 'Currency_Icon_Gold', 'Credits', abbreviateNumber(skill_upgrade_credits[skillLevel - 2]), 'Item')

        $('#ba-skill-materials').html(html)
        $('#ba-skill-materials div').each(function(i,el) {
            $(el).tooltip({html: true})
        })
    } else {
        $('#ba-skill-materials').html('<span class="pb-2">No materials required.</span>')
    }
}

function recalculateWeaponSkillPreview() {
    var skillLevel = $("#ba-weapon-skillpreview-range").val()
    $('#ba-weapon-skill-passive-description').html(getSkillText(student.weapon_skill_passive_description, student.weapon_skill_passive_parameters, skillLevel))
    $('.ba-skill-debuff, .ba-skill-buff, .ba-skill-special, .ba-skill-cc').each(function(i,el) {
        $(el).tooltip({html: true})
    })
}

function recalculateBondPreview() {
    var level = $("#ba-bond-levelrange").val()
    var bondbonus = getBondStats(student, level)
    $("#ba-student-bond-1-amount").text('+'+bondbonus[student.bond_stat[0]])
    $("#ba-student-bond-2-amount").text('+'+bondbonus[student.bond_stat[1]])    
}

function getBondStats(student, level) {
    var stat1 = 0, stat2 = 0
    for (let i = 1; i < Math.min(level, 50); i++) {
        if (i < 20) {
            stat1 += student.bond_stat_value[Math.floor(i / 5)][0]
            stat2 += student.bond_stat_value[Math.floor(i / 5)][1]
        } else if (i < 50) {
            stat1 += student.bond_stat_value[2 + Math.floor(i / 10)][0]
            stat2 += student.bond_stat_value[2 + Math.floor(i / 10)][1]
        }
    }
    return {[student.bond_stat[0]]: stat1, [student.bond_stat[1]]: stat2}
}

function changeStatPreviewStars(stars) {
    stat_preview_stars = stars

    for (let i = 1; i <= 5; i++) {
        i <= stars ? $("#ba-statpreview-star-" + i).attr("src", "images/ui/Common_Icon_Formation_Star.png") : $("#ba-statpreview-star-" + i).attr("src", "images/ui/Common_Icon_Formation_Star_Disable.png")
    }

    stars == 5 ? $("#ba-statpreview-includeweapon").prop("disabled",false).prop("checked",true).trigger("change") : $("#ba-statpreview-includeweapon").prop("disabled", true).prop("checked",false).trigger("change")
    recalculateStatPreview()
}

function toggleStatPreviewWeapon(el) {
    if (el.checked == true) {
        $(".ba-weaponpreview-star").toggleClass("disabled",false)
    } else {
        $(".ba-weaponpreview-star").toggleClass("disabled",true)
    }
    recalculateStatPreview()
    recalculateTerrainAffinity()
}

function changeWeaponPreviewStars(el, stars) {
    if (!$(el).hasClass("disabled")) {
        stat_preview_weapon_stars = stars

        for (let i = 1; i <= 3; i++) {
            i <= stars ? $("#ba-weaponpreview-star-" + i).attr("src", "images/ui/Common_Icon_Formation_Star_2.png") : $("#ba-weaponpreview-star-" + i).attr("src", "images/ui/Common_Icon_Formation_Star_Disable.png")
        }
        
        recalculateStatPreview()
        recalculateTerrainAffinity()
    }
}