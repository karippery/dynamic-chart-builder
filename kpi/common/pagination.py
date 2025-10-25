# common/pagination.py
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class DefaultPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'page': self.page.number,
            'pages': self.page.paginator.num_pages,
            'results': data
        })

    def get_paginated_dict(self, data):
        """Return pagination metadata as dict for embedding in larger responses."""
        return {
            'count': self.page.paginator.count,
            'page': self.page.number,
            'pages': self.page.paginator.num_pages,
            'page_size': self.get_page_size(self.request)
        }