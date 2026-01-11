
import qrcode
import base64
from io import BytesIO
from django.utils.safestring import mark_safe

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Group, Lesson, Attendance

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Учебная информация', {'fields': ('role', 'academic_groups')}),
    )
    list_display = ['username', 'role', 'get_academic_groups', 'is_staff']
    list_filter = ['role']

    def get_academic_groups(self, obj):
        return ", ".join([g.name for g in obj.academic_groups.all()])
    get_academic_groups.short_description = 'Учебные группы'

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name']

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['course_name', 'teacher', 'get_lesson_groups', 'start_time', 'end_time', 'is_active', 'qr_token', 'display_qr_code']
    readonly_fields = ['qr_token', 'display_qr_code']
    filter_horizontal = ['lesson_groups']

    def get_lesson_groups(self, obj):
        return ", ".join([g.name for g in obj.lesson_groups.all()])
    get_lesson_groups.short_description = 'Группы на уроке'
    
    @admin.display(description='Статус урока (Идет или нет?)', boolean=True)
    def is_active(self, obj):
        return obj.is_active
    
    def display_qr_code(self, obj):
        if not obj.qr_token:
            return "Нет данных"

        qr = qrcode.QRCode(version=1, box_size=5, border=2)
        qr.add_data(obj.qr_token)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")

        buffer = BytesIO()
        img.save(buffer, format="PNG")
        img_str = base64.b64encode(buffer.getvalue()).decode()

        return mark_safe(f'<img src="data:image/png;base64,{img_str}" width="150" height="150" />')

    display_qr_code.short_description = 'QR-код'

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'lesson', 'scan_time', 'device_id']
    list_filter = ['lesson__course_name', 'scan_time']