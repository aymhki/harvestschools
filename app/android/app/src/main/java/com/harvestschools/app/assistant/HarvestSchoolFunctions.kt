package com.harvestschools.app.assistant

import androidx.appfunctions.AppFunction
import androidx.appfunctions.AppFunctionContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

class HarvestSchoolFunctions {

    private companion object {
        const val MAX_BOOKS_PER_CATEGORY = 50
    }

    /**
     * Answers a general question about Harvest International Schools from its published information.
     *
     * Use this for questions about the address, opening hours, admission requirements, discounts,
     * accreditations, transport, or anything not covered by the more specific functions.
     *
     * @param query The user's question in their own words, for example "where is the school" or
     *   "what documents do I need to apply". Must not be empty.
     * @return Up to 5 matching facts ordered by relevance. An EMPTY list means the school has not
     *   published an answer to that question - say so plainly and refer the user to the admissions
     *   department rather than guessing.
     */
    @AppFunction(isDescribedByKDoc = true)
    suspend fun getSchoolInfo(appFunctionContext: AppFunctionContext, query: String): List<SchoolFactResult> =
        withContext(Dispatchers.IO) {
            val knowledge = loadKnowledge(appFunctionContext) ?: return@withContext emptyList()
            val terms = query.lowercase(Locale.ROOT).split(" ").filter { it.isNotBlank() }
            val facts = knowledge.optJSONArray("facts") ?: return@withContext emptyList()

            val matches = mutableListOf<Pair<Int, SchoolFactResult>>()

            for (index in 0 until facts.length()) {
                val fact = facts.optJSONObject(index) ?: continue
                val haystack = buildString {
                    append(fact.optString("topic")).append(' ')
                    append(fact.optString("answer")).append(' ')
                    append(fact.optJSONArray("keywords")?.joinToText().orEmpty())
                }.lowercase(Locale.ROOT)

                val score = terms.count { haystack.contains(it) }

                if (score > 0) {
                    matches.add(score to fact.toFactResult())
                }
            }

            matches.sortedByDescending { it.first }.take(5).map { it.second }
        }

    /**
     * Reports the published annual tuition fees for the school's stages.
     *
     * @param appFunctionContext Provided by the system.
     * @param department Optional department filter. Allowed values: "national", "british",
     *   "american", "early". Pass an empty string for all departments.
     * @param stage Optional stage name filter such as "Grade 5" or "Year 7". Pass an empty string
     *   for all stages in the selected department.
     * @return Matching stages with fees in Egyptian Pounds (EGP). IMPORTANT: when a stage has
     *   isTuitionPublished = false, its tuitionFees value is 0 and that 0 is NOT a price. Tell the
     *   user the fee for that stage is not published and refer them to the admissions department.
     *   An empty list means no stage matched the filters.
     */
    @AppFunction(isDescribedByKDoc = true)
    suspend fun getTuitionFees(
        appFunctionContext: AppFunctionContext,
        department: String,
        stage: String,
    ): List<SchoolStageResult> = withContext(Dispatchers.IO) {
        selectStages(appFunctionContext, department, stage)
    }

    /**
     * Lists the school's stages with their minimum registration ages.
     *
     * @param appFunctionContext Provided by the system.
     * @param department Optional department filter. Allowed values: "national", "british",
     *   "american", "early". Pass an empty string for all departments.
     * @return Every stage the school publishes, each with isOffered = true, meaning the school
     *   accepts students into it. Minimum ages are published text such as "9 years and 6 months";
     *   students must meet the minimum age by October 1st. An empty list means the school publishes
     *   no stage for that filter, so say the stage is not available rather than guessing at its age.
     */
    @AppFunction(isDescribedByKDoc = true)
    suspend fun getStagesOffered(
        appFunctionContext: AppFunctionContext,
        department: String,
    ): List<SchoolStageResult> = withContext(Dispatchers.IO) {
        selectStages(appFunctionContext, department, stage = "")
    }

    /**
     * Finds events in the school's academic calendars.
     *
     * @param appFunctionContext Provided by the system.
     * @param query Optional text to match against event titles. Empty string matches everything.
     * @param division Optional calendar filter. Allowed values: "national", "british", "american",
     *   "national-kg", "british-kg", "american-kg". Empty string searches all six calendars.
     * @param fromDateMillis Only return events ending on or after this instant, in epoch
     *   milliseconds. Pass 0 for no lower bound.
     * @param toDateMillis Only return events starting on or before this instant, in epoch
     *   milliseconds. Pass 0 for no upper bound.
     * @return Up to 25 matching events ordered by start date, earliest first. An empty list means
     *   nothing matched - do not invent dates.
     */
    @AppFunction(isDescribedByKDoc = true)
    suspend fun findAcademicEvents(
        appFunctionContext: AppFunctionContext,
        query: String,
        division: String,
        fromDateMillis: Long,
        toDateMillis: Long,
    ): List<AcademicEventResult> = withContext(Dispatchers.IO) {
        val knowledge = loadKnowledge(appFunctionContext) ?: return@withContext emptyList()
        val events = knowledge.optJSONArray("events") ?: return@withContext emptyList()
        val needle = query.lowercase(Locale.ROOT)
        val results = mutableListOf<AcademicEventResult>()

        for (index in 0 until events.length()) {
            val event = events.optJSONObject(index) ?: continue

            if (division.isNotBlank() && !division.equals(event.optString("calendarId"), ignoreCase = true)) {
                continue
            }

            if (needle.isNotBlank() && !event.optString("title").lowercase(Locale.ROOT).contains(needle)) {
                continue
            }

            val start = event.optLong("startDate", 0L)
            val end = event.optLong("endDate", start)

            if (fromDateMillis > 0L && end < fromDateMillis) {
                continue
            }

            if (toDateMillis > 0L && start > toDateMillis) {
                continue
            }

            results.add(event.toEventResult())
        }

        results.sortedBy { it.startDateMillis }.take(25)
    }

    /**
     * Reports the soonest upcoming event in the school's academic calendars.
     *
     * @param appFunctionContext Provided by the system.
     * @param division Optional calendar filter. Allowed values: "national", "british", "american",
     *   "national-kg", "british-kg", "american-kg". Empty string considers all six calendars.
     * @return A single-element list holding the next event, or an EMPTY list when no future event
     *   is published - in that case say the calendar has no further events rather than guessing.
     */
    @AppFunction(isDescribedByKDoc = true)
    suspend fun getNextSchoolEvent(
        appFunctionContext: AppFunctionContext,
        division: String,
    ): List<AcademicEventResult> = withContext(Dispatchers.IO) {
        findAcademicEvents(appFunctionContext, "", division, System.currentTimeMillis(), 0L).take(1)
    }

    /**
     * Returns the school's contact directory and general published details.
     *
     * @param appFunctionContext Provided by the system.
     * @param department Optional department filter. Allowed values: "reception", "student_affairs",
     *   "accounting", "admissions", "early", "national", "british", "american". Empty string
     *   returns every department.
     * @return Matching departments with phone numbers in international form without a leading plus.
     *   Direct fee questions to "accounting" and application questions to "admissions".
     */
    @AppFunction(isDescribedByKDoc = true)
    suspend fun getSchoolContactDetails(
        appFunctionContext: AppFunctionContext,
        department: String,
    ): List<SchoolContactResult> = withContext(Dispatchers.IO) {
        val knowledge = loadKnowledge(appFunctionContext) ?: return@withContext emptyList()
        val departments = knowledge.optJSONArray("departments") ?: return@withContext emptyList()
        val results = mutableListOf<SchoolContactResult>()

        for (index in 0 until departments.length()) {
            val entry = departments.optJSONObject(index) ?: continue

            if (department.isNotBlank() && !department.equals(entry.optString("key"), ignoreCase = true)) {
                continue
            }

            results.add(
                SchoolContactResult(
                    key = entry.optString("key"),
                    name = entry.optString("name"),
                    contactNumber = entry.optString("contactNumber"),
                    isAcademic = entry.optBoolean("isAcademic", false),
                )
            )
        }

        results
    }

    /**
     * Looks up the teachers, coordinators and heads the school publishes.
     *
     * Use this for questions like "who teaches maths in the British department" or "who is the head
     * of the American department". Staff who serve the whole school, such as reception or
     * accounting, appear under every department.
     *
     * @param appFunctionContext Provided by the system.
     * @param department Optional department filter. Allowed values: "national", "british",
     *   "american", "kindergarten". Empty string searches every department.
     * @param query Optional text matched against names, positions, subjects and academic degrees.
     *   Empty string returns everyone in the chosen department.
     * @return Matching staff, heads and vices first. An EMPTY list means the school has not
     *   published that list - say so rather than naming anyone.
     */
    @AppFunction(isDescribedByKDoc = true)
    suspend fun getSchoolStaff(
        appFunctionContext: AppFunctionContext,
        department: String,
        query: String,
    ): List<SchoolStaffResult> = withContext(Dispatchers.IO) {
        val knowledge = loadKnowledge(appFunctionContext) ?: return@withContext emptyList()
        val staff = knowledge.optJSONArray("staff") ?: return@withContext emptyList()
        val needle = query.trim().lowercase(Locale.ROOT)
        val results = mutableListOf<SchoolStaffResult>()

        for (index in 0 until staff.length()) {
            val entry = staff.optJSONObject(index) ?: continue

            if (department.isNotBlank() && !department.equals(entry.optString("departmentKey"), ignoreCase = true)) {
                continue
            }

            val departmentName = entry.optString("departmentName")
            val routePath = entry.optString("routePath")

            for ((people, isLead) in listOf(
                entry.optJSONArray("highlights") to true,
                entry.optJSONArray("members") to false,
            )) {
                val list = people ?: continue

                for (personIndex in 0 until list.length()) {
                    val person = list.optJSONObject(personIndex) ?: continue
                    val name = person.optString("name")
                    val position = person.optString("position")
                    val subject = person.optString("subject")
                    val degree = person.optString("degree")

                    if (needle.isNotEmpty()) {
                        val haystack = "$name $position $subject $degree $departmentName".lowercase(Locale.ROOT)

                        if (!haystack.contains(needle)) {
                            continue
                        }
                    }

                    results.add(
                        SchoolStaffResult(
                            name = name,
                            position = position,
                            subject = subject,
                            degree = degree,
                            departmentName = departmentName,
                            isDepartmentLead = isLead,
                            routePath = routePath,
                        )
                    )
                }
            }
        }

        results
    }

    /**
     * Searches the books the school library lends to students.
     *
     * Use this for questions like "does the library have Alice in Wonderland" or "what Arabic
     * stories can my child borrow". The school keeps an English library and an Arabic library,
     * each split into categories, and lists every book in both languages.
     *
     * @param appFunctionContext Provided by the system.
     * @param query Optional text matched against book titles and their series or publisher. Empty
     *   string returns the whole shelf, so prefer a query when the user named a book.
     * @param category Optional category filter. Allowed values: "english-fairy-tales",
     *   "english-drama", "english-levels", "english-general", "arabic-information",
     *   "arabic-general", "arabic-religion", "arabic-stories". Empty string searches every category.
     * @param collection Optional filter for which library holds the book. Allowed values:
     *   "english", "arabic". Empty string searches both.
     * @return Matching books, at most 50 per category. An EMPTY list means the library does not
     *   lend that book - say so rather than inventing a title or an author.
     */
    @AppFunction(isDescribedByKDoc = true)
    suspend fun getLibraryBooks(
        appFunctionContext: AppFunctionContext,
        query: String,
        category: String,
        collection: String,
    ): List<LibraryBookResult> = withContext(Dispatchers.IO) {
        val knowledge = loadKnowledge(appFunctionContext) ?: return@withContext emptyList()
        val library = knowledge.optJSONArray("library") ?: return@withContext emptyList()
        val needle = query.trim().lowercase(Locale.ROOT)
        val results = mutableListOf<LibraryBookResult>()

        for (index in 0 until library.length()) {
            val entry = library.optJSONObject(index) ?: continue

            if (category.isNotBlank() && !category.equals(entry.optString("categoryKey"), ignoreCase = true)) {
                continue
            }

            if (collection.isNotBlank() && !collection.equals(entry.optString("collection"), ignoreCase = true)) {
                continue
            }

            val books = entry.optJSONArray("books") ?: continue
            val categoryName = entry.optString("categoryName")
            val collectionName = entry.optString("collectionName")
            val routePath = entry.optString("routePath")
            var takenFromCategory = 0

            for (bookIndex in 0 until books.length()) {
                if (takenFromCategory >= MAX_BOOKS_PER_CATEGORY) {
                    break
                }

                val book = books.optJSONObject(bookIndex) ?: continue
                val title = book.optString("title")
                val series = book.optString("series")

                if (needle.isNotEmpty() && !"$title $series".lowercase(Locale.ROOT).contains(needle)) {
                    continue
                }

                takenFromCategory += 1

                results.add(
                    LibraryBookResult(
                        title = title,
                        series = series,
                        categoryName = categoryName,
                        collectionName = collectionName,
                        routePath = routePath,
                    )
                )
            }
        }

        results
    }

    /**
     * Lists the pages the Harvest Schools app can open.
     *
     * @param appFunctionContext Provided by the system.
     * @param section Optional section filter. Allowed values: "general", "admission", "academics",
     *   "students-life", "events", "gallery". Empty string returns every page.
     * @return Pages with the in-app route path to open. Only public pages appear here; there is no
     *   page for administrative, alumni or booking areas.
     */
    @AppFunction(isDescribedByKDoc = true)
    suspend fun listSchoolPages(
        appFunctionContext: AppFunctionContext,
        section: String,
    ): List<AppPageResult> = withContext(Dispatchers.IO) {
        val knowledge = loadKnowledge(appFunctionContext) ?: return@withContext emptyList()
        val pages = knowledge.optJSONArray("pages") ?: return@withContext emptyList()
        val results = mutableListOf<AppPageResult>()

        for (index in 0 until pages.length()) {
            val page = pages.optJSONObject(index) ?: continue

            if (section.isNotBlank() && !section.equals(page.optString("section"), ignoreCase = true)) {
                continue
            }

            results.add(
                AppPageResult(
                    id = page.optString("id"),
                    title = page.optString("title"),
                    routePath = page.optString("routePath"),
                    section = page.optString("section"),
                )
            )
        }

        results
    }

    private fun selectStages(
        appFunctionContext: AppFunctionContext,
        department: String,
        stage: String,
    ): List<SchoolStageResult> {
        val knowledge = loadKnowledge(appFunctionContext) ?: return emptyList()
        val stages = knowledge.optJSONArray("stages") ?: return emptyList()
        val needle = stage.lowercase(Locale.ROOT)
        val results = mutableListOf<SchoolStageResult>()

        for (index in 0 until stages.length()) {
            val entry = stages.optJSONObject(index) ?: continue

            if (department.isNotBlank() && !department.equals(entry.optString("departmentKey"), ignoreCase = true)) {
                continue
            }

            if (needle.isNotBlank() && !entry.optString("name").lowercase(Locale.ROOT).contains(needle)) {
                continue
            }

            results.add(entry.toStageResult())
        }

        return results
    }

    private fun loadKnowledge(appFunctionContext: AppFunctionContext): JSONObject? {
        val language = if (Locale.getDefault().language.equals("ar", ignoreCase = true)) "ar" else "en"

        return HarvestAssistantStore.knowledge(appFunctionContext.context, language)
    }
}

private fun JSONArray.joinToText(): String {
    val builder = StringBuilder()

    for (index in 0 until length()) {
        builder.append(optString(index)).append(' ')
    }

    return builder.toString()
}

private fun JSONObject.toFactResult(): SchoolFactResult = SchoolFactResult(
    id = optString("id"),
    category = optString("category"),
    topic = optString("topic"),
    answer = optString("answer"),
    routePath = optString("routePath"),
)

private fun JSONObject.toStageResult(): SchoolStageResult {
    val hasFees = !isNull("tuitionFees") && optLong("tuitionFees", 0L) > 0L

    return SchoolStageResult(
        key = optString("key"),
        name = optString("name"),
        departmentName = optString("departmentName"),
        sectionTitle = optString("sectionTitle"),
        isOffered = optBoolean("isOffered", true),
        minimumAge = optString("minimumAge"),
        tuitionFees = if (hasFees) optLong("tuitionFees") else 0L,
        isTuitionPublished = hasFees,
    )
}

private fun JSONObject.toEventResult(): AcademicEventResult {
    val start = optLong("startDate", 0L)

    return AcademicEventResult(
        id = optString("id"),
        title = optString("title"),
        startDateMillis = start,
        endDateMillis = optLong("endDate", start),
        calendarId = optString("calendarId"),
        calendarLabel = optString("calendarLabel"),
        routePath = optString("routePath"),
    )
}
