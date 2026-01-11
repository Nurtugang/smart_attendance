from rest_framework import serializers
from .models import User, Group, Lesson
from django.utils import timezone

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    academic_groups = serializers.SlugRelatedField(many=True, read_only=True, slug_field='name')

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'role', 'academic_groups']

class LessonSerializer(serializers.ModelSerializer):
    teacher = UserSerializer(read_only=True)
    lesson_groups = GroupSerializer(many=True, read_only=True)
    is_active = serializers.ReadOnlyField()
    attendance_info = serializers.SerializerMethodField()
    server_time = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'course_name', 'teacher', 'lesson_groups', 
            'start_time', 'end_time', 'qr_token', 'is_active', 'attendance_info', 'server_time'
        ]
        
    def get_attendance_info(self, obj):
        request = self.context.get('request')
        user = request.user
        
        if not user or not user.is_authenticated:
            return None

        # Для студента оставляем как было (ему важно видеть свой статус сразу)
        if user.role == User.STUDENT:
            attendance = obj.marks.filter(student=user).first()
            if attendance:
                return {
                    "role": "student",
                    "is_present": True,
                    "scan_time": timezone.localtime(attendance.scan_time).strftime("%H:%M")
                }
            return {"role": "student", "is_present": False}

        # Для преподавателя УБИРАЕМ счетчики. Просто помечаем роль.
        elif user.role == User.TEACHER:
            return {"role": "teacher"}
            
        return None

    def get_server_time(self, obj):
        return timezone.localtime(timezone.now()).strftime("%d.%m.%Y %H:%M")

class LessonDetailTeacherSerializer(serializers.ModelSerializer):
    students_attendance = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'course_name', 'start_time', 'end_time', 'students_attendance']

    def get_students_attendance(self, obj):
        # 1. Берем всех студентов из групп, привязанных к уроку
        students = User.objects.filter(
            academic_groups__in=obj.lesson_groups.all(),
            role=User.STUDENT
        ).distinct()

        # 2. Берем все отметки для этого урока
        attendances = {a.student_id: a.scan_time for a in obj.marks.all()}

        # 3. Формируем список
        result = []
        for student in students:
            scan_time = attendances.get(student.id)
            result.append({
                "id": student.id,
                "full_name": f"{student.last_name} {student.first_name}",
                "username": student.username,
                "is_present": scan_time is not None,
                "scan_time": timezone.localtime(scan_time).strftime("%H:%M") if scan_time else "-"
            })
        
        # Сортируем: сначала те, кто пришел
        return sorted(result, key=lambda x: x['is_present'], reverse=True)