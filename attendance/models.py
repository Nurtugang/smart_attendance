import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser

class Group(models.Model):
    name = models.CharField(max_length=50, unique=True)
    
    def __str__(self):
        return self.name

class User(AbstractUser):
    STUDENT = 'student'
    TEACHER = 'teacher'
    ADMIN = 'admin'
    ROLE_CHOICES = [(STUDENT, 'Student'), (TEACHER, 'Teacher'), (ADMIN, 'Admin')]

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=STUDENT)
    
    academic_groups = models.ManyToManyField(Group, blank=True, related_name='users')

    def __str__(self):
        return f"{self.username} ({self.role})"

class Lesson(models.Model):
    course_name = models.CharField(max_length=255)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lessons_taught')
    
    lesson_groups = models.ManyToManyField(Group, related_name='lessons')
    
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    qr_token = models.CharField(max_length=255, unique=True, default=uuid.uuid4)

    @property
    def is_active(self):
        return self.start_time <= timezone.now() <= self.end_time

    def __str__(self):
        return f"{self.course_name} | {self.teacher.username}"

class Attendance(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='my_attendances')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='marks')
    scan_time = models.DateTimeField(auto_now_add=True)
    device_id = models.CharField(max_length=255)

    class Meta:
        unique_together = ('student', 'lesson')