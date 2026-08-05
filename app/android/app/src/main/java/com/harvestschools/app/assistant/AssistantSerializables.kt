package com.harvestschools.app.assistant

import androidx.appfunctions.AppFunctionSerializable

/**
 * A single published fact about Harvest International Schools.
 *
 * @property id Stable identifier, for example "fact.fees.stg_am_g5".
 * @property category One of: contact, admission, academics, stages, fees, faq, about, policy.
 * @property topic Short human-readable subject of the fact.
 * @property answer The full answer text, already localised and with links removed.
 * @property routePath In-app path that shows this information, for example "/admission/admission-fees". May be empty.
 */
@AppFunctionSerializable(isDescribedByKDoc = true)
data class SchoolFactResult(
    val id: String,
    val category: String,
    val topic: String,
    val answer: String,
    val routePath: String,
)

/**
 * An educational stage offered by the school, with its published fees and minimum age.
 *
 * @property key Stable stage identifier, for example "stg_am_g5".
 * @property name Stage name in the requested language, for example "Grade 5".
 * @property departmentName Owning department, for example "American Department".
 * @property sectionTitle Stage group, for example "Elementary".
 * @property isOffered True when the school currently accepts students into this stage.
 * @property minimumAge Minimum registration age as published text, for example "9 years and 6 months". Empty when unpublished.
 * @property tuitionFees Annual tuition in Egyptian Pounds (EGP). Zero means the fee is NOT published - never present zero as a price.
 * @property isTuitionPublished False when the school has not published a fee for this stage. When false, tell the user the fee is unpublished and refer them to admissions.
 */
@AppFunctionSerializable(isDescribedByKDoc = true)
data class SchoolStageResult(
    val key: String,
    val name: String,
    val departmentName: String,
    val sectionTitle: String,
    val isOffered: Boolean,
    val minimumAge: String,
    val tuitionFees: Long,
    val isTuitionPublished: Boolean,
)

/**
 * A contactable department of the school.
 *
 * @property key Stable department identifier, for example "admissions".
 * @property name Department name in the requested language.
 * @property contactNumber Phone number in international form without a leading plus, for example "201062255862".
 * @property isAcademic True for teaching departments, false for administrative ones such as accounting or reception.
 */
@AppFunctionSerializable(isDescribedByKDoc = true)
data class SchoolContactResult(
    val key: String,
    val name: String,
    val contactNumber: String,
    val isAcademic: Boolean,
)

/**
 * An event from one of the six school academic calendars.
 *
 * @property id Stable event identifier.
 * @property title Event title in the requested language.
 * @property startDateMillis Start of the event in epoch milliseconds, UTC.
 * @property endDateMillis End of the event in epoch milliseconds, UTC. Equals startDateMillis for single-day events.
 * @property calendarId One of: national, british, american, national-kg, british-kg, american-kg.
 * @property calendarLabel Human-readable calendar name.
 * @property routePath In-app path showing the calendar this event belongs to.
 */
@AppFunctionSerializable(isDescribedByKDoc = true)
data class AcademicEventResult(
    val id: String,
    val title: String,
    val startDateMillis: Long,
    val endDateMillis: Long,
    val calendarId: String,
    val calendarLabel: String,
    val routePath: String,
)

/**
 * A page inside the Harvest Schools app that can be opened.
 *
 * @property id Stable page identifier.
 * @property title Page title in the requested language.
 * @property routePath In-app path, for example "/academics/british".
 * @property section Grouping such as general, admission, academics, students-life, events, gallery.
 */
@AppFunctionSerializable(isDescribedByKDoc = true)
data class AppPageResult(
    val id: String,
    val title: String,
    val routePath: String,
    val section: String,
)

/**
 * General published information about the school.
 *
 * @property name School name.
 * @property address Postal address.
 * @property generalPhone Main contact number. Empty when unpublished.
 * @property email Contact email address.
 * @property website Public website URL.
 * @property workingHours Published opening hours, for example "Sunday to Thursday: 8:00 AM - 3:00 PM". Empty when unpublished.
 * @property mapsUrl Link to the school location in Maps.
 * @property tuitionCurrency Currency code used for all fees, normally "EGP".
 */
@AppFunctionSerializable(isDescribedByKDoc = true)
data class SchoolProfileResult(
    val name: String,
    val address: String,
    val generalPhone: String,
    val email: String,
    val website: String,
    val workingHours: String,
    val mapsUrl: String,
    val tuitionCurrency: String,
)
