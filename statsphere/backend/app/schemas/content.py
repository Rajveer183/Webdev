"""Schemas for curated content (data/content/*.json) and the public catalogue API.

The same models validate seed files, admin edits and API responses, so a record
that would break the website cannot be saved.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field

Status = Literal["published", "draft", "archived"]
Availability = Literal["proposed", "enquiries_open", "enrolling", "closed"]
Category = Literal["Statistics", "Mathematics", "Data Science", "Machine Learning", "Analytics", "Programming", "Research"]
Level = Literal["Beginner", "Intermediate", "Advanced"]
CourseFormat = Literal["short-course", "workshop", "extended"]
DeliveryMode = Literal["online", "in-person", "hybrid"]

NonEmpty = Annotated[str, Field(min_length=1)]
Slug = Annotated[str, Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=120)]


class ContentModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ProcessStep(ContentModel):
    step: NonEmpty
    detail: NonEmpty


class ServiceContent(ContentModel):
    slug: Slug
    title: NonEmpty
    category: Category
    icon: NonEmpty
    summary: NonEmpty
    overview: NonEmpty
    problems: list[NonEmpty]
    audience: list[NonEmpty]
    client_inputs: list[NonEmpty]
    process: list[ProcessStep]
    deliverables: list[NonEmpty]
    applications: list[NonEmpty]
    methods: list[NonEmpty]
    tools: list[NonEmpty]
    related_courses: list[Slug] = []
    related_articles: list[Slug] = []
    source_pages: list[int]
    featured: bool = False
    order: int = 0
    status: Status = "draft"
    availability: Availability = "proposed"
    approval_note: str | None = None


class CourseModule(ContentModel):
    title: NonEmpty
    topics: list[NonEmpty]


class SourceModule(ContentModel):
    name: NonEmpty
    code: str
    pages: list[int]


class Certificate(ContentModel):
    type: Literal["completion"] = "completion"
    eligibility: list[NonEmpty]


class CourseContent(ContentModel):
    slug: Slug
    title: NonEmpty
    category: Category
    level: Level
    format: CourseFormat
    summary: NonEmpty
    description: NonEmpty
    learning_objectives: list[NonEmpty]
    modules: list[CourseModule]
    prerequisites: list[NonEmpty]
    audience: list[NonEmpty]
    projects: list[NonEmpty]
    tools: list[NonEmpty]
    teaching_format: NonEmpty
    delivery_modes: list[DeliveryMode] = []
    proposed_duration: NonEmpty
    proposed_hours: int = Field(gt=0, le=500)
    assessment: list[NonEmpty]
    certificate: Certificate
    fee: str | None = None
    availability: Availability = "proposed"
    related_services: list[Slug] = []
    related_articles: list[Slug] = []
    source_modules: list[SourceModule]
    source_pages: list[int]
    featured: bool = False
    order: int = 0
    status: Status = "draft"


class ParagraphBlock(ContentModel):
    type: Literal["paragraph", "heading"]
    text: NonEmpty


class FormulaBlock(ContentModel):
    type: Literal["formula"]
    tex: NonEmpty
    caption: str | None = None


class ListBlock(ContentModel):
    type: Literal["list"]
    items: list[NonEmpty]


class TableBlock(ContentModel):
    type: Literal["table"]
    columns: list[str]
    rows: list[list[str]]


class CalloutBlock(ContentModel):
    type: Literal["callout"]
    title: NonEmpty
    text: NonEmpty


class ExampleBlock(ContentModel):
    type: Literal["example"]
    title: NonEmpty
    text: str = ""
    steps: list[NonEmpty] = []


ArticleBlock = Annotated[
    ParagraphBlock | FormulaBlock | ListBlock | TableBlock | CalloutBlock | ExampleBlock,
    Field(discriminator="type"),
]


class ArticleContent(ContentModel):
    slug: Slug
    title: NonEmpty
    category: Category
    summary: NonEmpty
    tags: list[NonEmpty]
    reading_minutes: int = Field(gt=0, le=120)
    body: list[ArticleBlock]
    source_pages: list[int]
    related_services: list[Slug] = []
    related_courses: list[Slug] = []
    order: int = 0
    status: Status = "draft"


class AgendaItem(ContentModel):
    session: NonEmpty
    detail: NonEmpty


class WorkshopContent(ContentModel):
    slug: Slug
    title: NonEmpty
    summary: NonEmpty
    participants: list[NonEmpty]
    objectives: list[NonEmpty]
    topics: list[NonEmpty]
    formats: list[NonEmpty]
    example_agenda: list[AgendaItem]
    customisation: list[NonEmpty]
    related_courses: list[Slug] = []
    source_pages: list[int]
    order: int = 0
    status: Status = "draft"


class ChartSeries(ContentModel):
    key: NonEmpty
    label: NonEmpty
    color: int = Field(ge=1, le=8)
    style: Literal["line", "dashed", "points", "line-points", "step", "bar"]
    error_key: str | None = None


class ReferenceLine(ContentModel):
    axis: Literal["x", "y"]
    value: float
    label: str


class ChartSpec(ContentModel):
    id: NonEmpty
    kind: Literal["line", "bar", "scatter", "step"]
    title: NonEmpty
    subtitle: str | None = None
    x_key: NonEmpty
    x_label: str
    y_label: str
    x_type: Literal["number", "category"] = "number"
    y_domain: list[float] | None = None
    layout: Literal["vertical", "horizontal"] | None = None
    series: list[ChartSeries]
    data: list[dict[str, Any]]
    overlay: list[dict[str, Any]] | None = None
    reference_lines: list[ReferenceLine] = []


class ResultItem(ContentModel):
    label: NonEmpty
    value: NonEmpty


class SimpleTable(ContentModel):
    columns: list[str]
    rows: list[list[str]]


class ProjectContent(ContentModel):
    slug: Slug
    title: NonEmpty
    category: Category
    summary: NonEmpty
    is_synthetic: bool
    problem: NonEmpty
    dataset: NonEmpty
    methodology: list[NonEmpty]
    process: list[NonEmpty]
    charts: list[ChartSpec]
    results: list[ResultItem]
    anova_table: SimpleTable | None = None
    interpretation: list[NonEmpty]
    limitations: list[NonEmpty]
    applications: list[NonEmpty]
    related_services: list[Slug] = []
    related_courses: list[Slug] = []
    related_articles: list[Slug] = []
    source_pages: list[int]
    featured: bool = False
    order: int = 0
    status: Status = "draft"


class TopicContent(ContentModel):
    id: Slug
    name: NonEmpty
    syllabus_code: str | None = None
    semester: int | None = None
    description: NonEmpty
    source_pages: list[int]
    opportunity_types: list[
        Literal["consulting", "course", "workshop", "project", "research-support", "article", "demo"]
    ] = []
    related_services: list[Slug] = []
    related_courses: list[Slug] = []
    related_articles: list[Slug] = []
    audience: list[str] = []
    prerequisites: list[str] = []
    applications: list[str] = []
    tools: list[str] = []
    website_section: str | None = None
    status: Literal["approved", "pending_review", "excluded"] = "pending_review"
    review_note: str | None = None


CONTENT_MODELS: dict[str, type[ContentModel]] = {
    "service": ServiceContent,
    "course": CourseContent,
    "article": ArticleContent,
    "workshop": WorkshopContent,
    "project": ProjectContent,
}

KIND_FILES = {
    "service": "services.json",
    "course": "courses.json",
    "article": "articles.json",
    "workshop": "workshops.json",
    "project": "projects.json",
}

Kind = Literal["service", "course", "article", "workshop", "project"]


# ---------- Public API envelopes ----------


class ListResponse(BaseModel):
    items: list[dict[str, Any]]
    total: int


class TopicSummary(BaseModel):
    id: str
    name: str
    description: str
    source_pages: list[int]
    related_services: list[str]
    related_courses: list[str]
    related_articles: list[str]
    website_section: str | None = None
